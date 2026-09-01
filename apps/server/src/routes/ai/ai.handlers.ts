import { db } from "@floos/db";
import {
  AI_RATE_LIMITS,
  consumeAiRateLimit,
  ensureAiChatForUserSpace,
  getActiveSpaceId,
  getAiChatForUserSpace,
  listAiMessages,
  resetAiChatForUserSpace,
  updateAiChatSession,
  type AiRateLimitBucket,
} from "@floos/db/queries";
import type { floosAgent } from "@floos/jobs";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { chat } from "@trigger.dev/sdk/ai";
import type { Context } from "hono";

import type { AppBindings, AppRouteHandler } from "../../lib/types";
import type {
  CreateSessionRoute,
  GetSessionRoute,
  RefreshTokenRoute,
  ResetSessionRoute,
} from "./ai.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

const startFloosSession = chat.createStartSessionAction<typeof floosAgent>("floos-agent", {
  tokenTTL: "1h",
});

type AiGate =
  | { ok: true; userId: string }
  | { ok: false; kind: "unauthorized" }
  | { ok: false; kind: "rate_limited"; retryAfterSec: number }
  | { ok: false; kind: "unavailable" };

/**
 * Caps AI session HTTP traffic only. Chat turns use a Trigger.dev public token
 * and are not covered here — this is not an LLM spend cap.
 */
async function requireAiUser(
  c: Context<AppBindings>,
  bucket: AiRateLimitBucket,
): Promise<AiGate> {
  const user = c.get("user");
  if (!user) {
    return { ok: false, kind: "unauthorized" };
  }

  const { limit, windowMs } = AI_RATE_LIMITS[bucket];
  try {
    const result = await consumeAiRateLimit(db, {
      userId: user.id,
      bucket,
      limit,
      windowMs,
    });
    if (!result.allowed) {
      return { ok: false, kind: "rate_limited", retryAfterSec: result.retryAfterSec };
    }
  } catch (err) {
    c.get("log").error(err instanceof Error ? err : new Error("AI rate limiter failed"));
    return { ok: false, kind: "unavailable" };
  }

  return { ok: true, userId: user.id };
}

function denyAiRequest(
  c: Context<AppBindings>,
  deny: Extract<AiGate, { ok: false }>,
) {
  if (deny.kind === "unauthorized") {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }
  if (deny.kind === "rate_limited") {
    c.header("Retry-After", String(deny.retryAfterSec));
    return c.json({ error: "RATE_LIMIT_EXCEEDED" }, HTTPStatusCodes.TOO_MANY_REQUESTS);
  }
  return c.json({ error: "RATE_LIMIT_EXCEEDED" }, HTTPStatusCodes.SERVICE_UNAVAILABLE);
}

async function mintPublicAccessToken(chatId: string) {
  return triggerAuth.createPublicToken({
    scopes: {
      read: { sessions: chatId },
      write: { sessions: chatId },
    },
    expirationTime: "1h",
  });
}

async function startOrResumeTriggerSession(row: {
  id: string;
  triggerSessionId: string | null;
}) {
  const started = await startFloosSession({ chatId: row.id, clientData: {} });
  if (row.triggerSessionId !== started.sessionId) {
    await updateAiChatSession(db, {
      chatId: row.id,
      triggerSessionId: started.sessionId,
    });
  }
  return started;
}

async function buildSessionResponse(row: {
  id: string;
  title: string | null;
  triggerSessionId: string | null;
  lastEventId: string | null;
}) {
  const [messages, started] = await Promise.all([
    listAiMessages(db, row.id),
    startOrResumeTriggerSession(row),
  ]);

  return {
    chatId: row.id,
    triggerSessionId: started.sessionId,
    publicAccessToken: started.publicAccessToken,
    messages: messages.map((message) => message.payload),
    title: row.title,
    lastEventId: row.lastEventId,
  };
}

export const createSession: AppRouteHandler<CreateSessionRoute> = async (c) => {
  const authz = await requireAiUser(c, "session");
  if (!authz.ok) return denyAiRequest(c, authz);

  const spaceId = await getActiveSpaceId(db, authz.userId);
  if (!spaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const chatRow = await ensureAiChatForUserSpace(db, spaceId, authz.userId);
  return c.json(await buildSessionResponse(chatRow), HTTPStatusCodes.OK);
};

export const getSession: AppRouteHandler<GetSessionRoute> = async (c) => {
  const authz = await requireAiUser(c, "session");
  if (!authz.ok) return denyAiRequest(c, authz);

  const spaceId = await getActiveSpaceId(db, authz.userId);
  if (!spaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const chatRow = await getAiChatForUserSpace(db, spaceId, authz.userId);
  if (!chatRow) {
    return c.json({ error: "NOT_FOUND" }, HTTPStatusCodes.NOT_FOUND);
  }

  const [messages, publicAccessToken] = await Promise.all([
    listAiMessages(db, chatRow.id),
    mintPublicAccessToken(chatRow.id),
  ]);

  return c.json(
    {
      chatId: chatRow.id,
      triggerSessionId: chatRow.triggerSessionId ?? "",
      publicAccessToken,
      messages: messages.map((message) => message.payload),
      title: chatRow.title,
      lastEventId: chatRow.lastEventId,
    },
    HTTPStatusCodes.OK,
  );
};

export const refreshToken: AppRouteHandler<RefreshTokenRoute> = async (c) => {
  const authz = await requireAiUser(c, "session");
  if (!authz.ok) return denyAiRequest(c, authz);

  const spaceId = await getActiveSpaceId(db, authz.userId);
  if (!spaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const chatRow = await getAiChatForUserSpace(db, spaceId, authz.userId);
  if (!chatRow) {
    return c.json({ error: "NOT_FOUND" }, HTTPStatusCodes.NOT_FOUND);
  }

  const publicAccessToken = await mintPublicAccessToken(chatRow.id);
  return c.json({ publicAccessToken }, HTTPStatusCodes.OK);
};

export const resetSession: AppRouteHandler<ResetSessionRoute> = async (c) => {
  const authz = await requireAiUser(c, "reset");
  if (!authz.ok) return denyAiRequest(c, authz);

  const spaceId = await getActiveSpaceId(db, authz.userId);
  if (!spaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const chatRow = await resetAiChatForUserSpace(db, spaceId, authz.userId);
  return c.json(await buildSessionResponse(chatRow), HTTPStatusCodes.OK);
};

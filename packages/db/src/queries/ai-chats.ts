import { and, asc, eq } from "drizzle-orm";

import type { Database } from "..";

import { aiChats, aiMessages } from "../schema/ai-chats";

export type AiMessagePayload = {
  id: string;
  role: string;
  [key: string]: unknown;
};

export async function getAiChatById(db: Database, chatId: string) {
  const [row] = await db.select().from(aiChats).where(eq(aiChats.id, chatId)).limit(1);
  return row ?? null;
}

export async function getAiChatForUserSpace(db: Database, spaceId: string, userId: string) {
  const [row] = await db
    .select()
    .from(aiChats)
    .where(and(eq(aiChats.spaceId, spaceId), eq(aiChats.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function ensureAiChatForUserSpace(db: Database, spaceId: string, userId: string) {
  const existing = await getAiChatForUserSpace(db, spaceId, userId);
  if (existing) return existing;

  try {
    const [created] = await db.insert(aiChats).values({ spaceId, userId }).returning();
    if (!created) {
      throw new Error("Failed to create AI chat");
    }
    return created;
  } catch {
    const raced = await getAiChatForUserSpace(db, spaceId, userId);
    if (raced) return raced;
    throw new Error("Failed to create AI chat");
  }
}

/** Drop the space/user chat row (messages cascade) and create a fresh one. */
export async function resetAiChatForUserSpace(db: Database, spaceId: string, userId: string) {
  const existing = await getAiChatForUserSpace(db, spaceId, userId);
  if (existing) {
    await db.delete(aiChats).where(eq(aiChats.id, existing.id));
  }
  return ensureAiChatForUserSpace(db, spaceId, userId);
}

export async function updateAiChatSession(
  db: Database,
  input: {
    chatId: string;
    triggerSessionId?: string | null;
    lastEventId?: string | null;
    title?: string | null;
  },
) {
  const patch: {
    triggerSessionId?: string | null;
    lastEventId?: string | null;
    title?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (input.triggerSessionId !== undefined) patch.triggerSessionId = input.triggerSessionId;
  if (input.lastEventId !== undefined) patch.lastEventId = input.lastEventId;
  if (input.title !== undefined) patch.title = input.title;

  const [updated] = await db
    .update(aiChats)
    .set(patch)
    .where(eq(aiChats.id, input.chatId))
    .returning();

  return updated ?? null;
}

export async function listAiMessages(db: Database, chatId: string) {
  return db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.chatId, chatId))
    .orderBy(asc(aiMessages.createdAt), asc(aiMessages.id));
}

/**
 * Replace the transcript with a full UIMessage[] snapshot.
 * Awaited (never deferred) so a mid-stream refresh still sees the user turn.
 */
export async function replaceAiMessages(
  db: Database,
  chatId: string,
  messages: AiMessagePayload[],
) {
  await db.transaction(async (tx) => {
    await tx.delete(aiMessages).where(eq(aiMessages.chatId, chatId));

    if (messages.length === 0) return;

    const now = Date.now();
    await tx.insert(aiMessages).values(
      messages.map((message, index) => ({
        chatId,
        role: message.role,
        payload: message,
        createdAt: new Date(now + index),
      })),
    );
  });
}

/**
 * Persist messages and session resume cursor together so a reload cannot
 * see a new assistant turn with a stale lastEventId.
 */
export async function persistAiTurn(
  db: Database,
  input: {
    chatId: string;
    messages: AiMessagePayload[];
    lastEventId?: string | null;
    triggerSessionId?: string | null;
    title?: string | null;
  },
) {
  await db.transaction(async (tx) => {
    await tx.delete(aiMessages).where(eq(aiMessages.chatId, input.chatId));

    if (input.messages.length > 0) {
      const now = Date.now();
      await tx.insert(aiMessages).values(
        input.messages.map((message, index) => ({
          chatId: input.chatId,
          role: message.role,
          payload: message,
          createdAt: new Date(now + index),
        })),
      );
    }

    const patch: {
      lastEventId?: string | null;
      triggerSessionId?: string | null;
      title?: string | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.lastEventId !== undefined) patch.lastEventId = input.lastEventId;
    if (input.triggerSessionId !== undefined) patch.triggerSessionId = input.triggerSessionId;
    if (input.title !== undefined) patch.title = input.title;

    await tx.update(aiChats).set(patch).where(eq(aiChats.id, input.chatId));
  });
}

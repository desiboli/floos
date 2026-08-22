import { db } from "@floos/db";
import {
  createSpaceInvites,
  getActiveSpace,
  getActiveSpaceId,
  getSpaceMemberRole,
  listPendingInvites,
  PendingInviteLimitError,
  revokeInvite,
} from "@floos/db/queries";
import { env } from "@floos/env/server";
import type { inviteSpaceMembers } from "@floos/jobs";
import { tasks } from "@trigger.dev/sdk";

import type { AppRouteHandler } from "../../lib/types";
import type {
  CreateInvitesRoute,
  ListInvitesRoute,
  RevokeInviteRoute,
} from "./spaces.invites.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

async function requireActiveSpaceOwner(
  userId: string,
): Promise<
  | { ok: true; activeSpaceId: string }
  | { ok: false; error: string; status: typeof HTTPStatusCodes.BAD_REQUEST | typeof HTTPStatusCodes.FORBIDDEN }
> {
  const activeSpaceId = await getActiveSpaceId(db, userId);
  if (!activeSpaceId) {
    return { ok: false, error: "No active space", status: HTTPStatusCodes.BAD_REQUEST };
  }

  const role = await getSpaceMemberRole(db, activeSpaceId, userId);
  if (role !== "owner") {
    return {
      ok: false,
      error: "Only the space owner can manage invites",
      status: HTTPStatusCodes.FORBIDDEN,
    };
  }

  return { ok: true, activeSpaceId };
}

function webOrigin() {
  return env.CORS_ORIGIN.replace(/\/$/, "");
}

export const createInvites: AppRouteHandler<CreateInvitesRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const owner = await requireActiveSpaceOwner(user.id);
  if (!owner.ok) {
    return c.json({ error: owner.error }, owner.status);
  }

  const { emails } = c.req.valid("json");

  if (emails.length === 0) {
    return c.json({ sent: 0, skipped: 0, skippedInvites: [] }, HTTPStatusCodes.OK);
  }

  const space = await getActiveSpace(db, user.id);
  if (!space) {
    return c.json({ error: "No active space" }, HTTPStatusCodes.BAD_REQUEST);
  }

  try {
    const { created, skipped } = await createSpaceInvites(db, {
      spaceId: owner.activeSpaceId,
      invitedByUserId: user.id,
      invitedByEmail: user.email,
      emails,
    });

    let warning: string | undefined;

    if (created.length > 0) {
      const payload = {
        invites: created.map((invite) => ({
          to: invite.email,
          spaceName: space.name,
          invitedByName: user.name,
          inviteUrl: `${webOrigin()}/invite/${invite.token}`,
        })),
      };

      try {
        await tasks.trigger<typeof inviteSpaceMembers>("invite-space-members", payload);
      } catch (err) {
        c.get("log").error(
          err instanceof Error ? err : new Error("Failed to enqueue invite emails"),
        );
        warning = "Invites were saved but emails could not be queued";
      }
    }

    return c.json(
      {
        sent: created.length,
        skipped: skipped.length,
        skippedInvites: skipped,
        ...(warning ? { warning } : {}),
      },
      HTTPStatusCodes.OK,
    );
  } catch (err) {
    if (err instanceof PendingInviteLimitError) {
      return c.json({ error: err.message }, HTTPStatusCodes.BAD_REQUEST);
    }
    const message = err instanceof Error ? err.message : "Failed to create invites";
    return c.json({ error: message }, HTTPStatusCodes.BAD_REQUEST);
  }
};

export const listInvites: AppRouteHandler<ListInvitesRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const owner = await requireActiveSpaceOwner(user.id);
  if (!owner.ok) {
    return c.json({ error: owner.error }, owner.status);
  }

  const rows = await listPendingInvites(db, owner.activeSpaceId);

  return c.json(
    {
      invites: rows.map((row) => ({
        id: row.id,
        email: row.email,
        status: "pending" as const,
        expiresAt: row.expiresAt.toISOString(),
      })),
    },
    HTTPStatusCodes.OK,
  );
};

export const revoke: AppRouteHandler<RevokeInviteRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const owner = await requireActiveSpaceOwner(user.id);
  if (!owner.ok) {
    return c.json({ error: owner.error }, owner.status);
  }

  const { id } = c.req.valid("param");
  const result = await revokeInvite(db, id, owner.activeSpaceId);

  if (!result.ok) {
    if (result.code === "not_found") {
      return c.json({ error: "Invite not found" }, HTTPStatusCodes.NOT_FOUND);
    }
    return c.json({ error: "Invite is not pending" }, HTTPStatusCodes.BAD_REQUEST);
  }

  return c.json({ id }, HTTPStatusCodes.OK);
};

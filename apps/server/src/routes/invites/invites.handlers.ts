import { db } from "@floos/db";
import { acceptInvite, declineInvite, getInviteByTokenHash, hashInviteToken } from "@floos/db/queries";

import type { AppRouteHandler } from "../../lib/types";
import type { AcceptRoute, DeclineRoute, PreviewRoute } from "./invites.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

export const preview: AppRouteHandler<PreviewRoute> = async (c) => {
  const { token } = c.req.valid("param");
  const invite = await getInviteByTokenHash(db, hashInviteToken(token));

  if (!invite) {
    return c.json({ error: "Invite not found" }, HTTPStatusCodes.NOT_FOUND);
  }

  return c.json(
    {
      spaceName: invite.spaceName,
      invitedByName: invite.invitedByName,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
    },
    HTTPStatusCodes.OK,
  );
};

export const accept: AppRouteHandler<AcceptRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const { token } = c.req.valid("param");
  const result = await acceptInvite(db, {
    tokenHash: hashInviteToken(token),
    userId: user.id,
    userEmail: user.email,
  });

  if (result.ok) {
    return c.json({ spaceId: result.spaceId }, HTTPStatusCodes.OK);
  }

  if (result.code === "not_found") {
    return c.json(
      { error: "Invite not found", code: "not_found" as const },
      HTTPStatusCodes.NOT_FOUND,
    );
  }

  if (result.code === "email_mismatch") {
    return c.json(
      { error: "This invite was sent to a different email", code: "email_mismatch" as const },
      HTTPStatusCodes.FORBIDDEN,
    );
  }

  if (result.code === "expired" || result.code === "revoked" || result.code === "declined" || result.code === "accepted") {
    return c.json(
      { error: `Invite cannot be accepted (${result.code})`, code: result.code },
      HTTPStatusCodes.BAD_REQUEST,
    );
  }

  return c.json(
    { error: "Invite cannot be accepted", code: "expired" as const },
    HTTPStatusCodes.BAD_REQUEST,
  );
};

export const decline: AppRouteHandler<DeclineRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const { token } = c.req.valid("param");
  const result = await declineInvite(db, {
    tokenHash: hashInviteToken(token),
    userEmail: user.email,
  });

  if (result.ok) {
    return c.json({ declined: true as const }, HTTPStatusCodes.OK);
  }

  if (result.code === "not_found") {
    return c.json(
      { error: "Invite not found", code: "not_found" as const },
      HTTPStatusCodes.NOT_FOUND,
    );
  }

  if (result.code === "email_mismatch") {
    return c.json(
      { error: "This invite was sent to a different email", code: "email_mismatch" as const },
      HTTPStatusCodes.FORBIDDEN,
    );
  }

  if (result.code === "expired" || result.code === "revoked" || result.code === "declined" || result.code === "accepted") {
    return c.json(
      { error: `Invite cannot be declined (${result.code})`, code: result.code },
      HTTPStatusCodes.BAD_REQUEST,
    );
  }

  return c.json(
    { error: "Invite cannot be declined", code: "expired" as const },
    HTTPStatusCodes.BAD_REQUEST,
  );
};

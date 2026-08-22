import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["Spaces"];

export const skipReasonSchema = z.enum(["self", "already_member", "already_invited", "duplicate"]);

export const createInvitesSchema = z.object({
  emails: z.array(z.email()).max(10),
});

export const createInvitesResponseSchema = z.object({
  sent: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  skippedInvites: z.array(
    z.object({
      email: z.email(),
      reason: skipReasonSchema,
    }),
  ),
  warning: z.string().optional(),
});

export const createInvites = createRoute({
  tags,
  path: "/spaces/invites",
  method: "post",
  summary: "Invite people to the active space",
  request: {
    body: {
      ...jsonContent(createInvitesSchema, "Emails to invite (max 10)"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(createInvitesResponseSchema, "Invites persisted"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(z.object({ error: z.string() }), "Invalid request"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
    [HTTPStatusCodes.FORBIDDEN]: jsonContent(z.object({ error: z.string() }), "Not the space owner"),
  },
});

export type CreateInvitesRoute = typeof createInvites;

export const pendingInviteSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  status: z.literal("pending"),
  expiresAt: z.iso.datetime(),
});

export const listInvitesResponseSchema = z.object({
  invites: z.array(pendingInviteSchema),
});

export const listInvites = createRoute({
  tags,
  path: "/spaces/invites",
  method: "get",
  summary: "List pending invites for the active space",
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(listInvitesResponseSchema, "Pending invites"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(z.object({ error: z.string() }), "No active space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
    [HTTPStatusCodes.FORBIDDEN]: jsonContent(z.object({ error: z.string() }), "Not the space owner"),
  },
});

export type ListInvitesRoute = typeof listInvites;

export const revokeInvite = createRoute({
  tags,
  path: "/spaces/invites/{id}",
  method: "delete",
  summary: "Revoke a pending invite",
  request: {
    params: z.object({
      id: z.uuid(),
    }),
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(z.object({ id: z.uuid() }), "Invite revoked"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(z.object({ error: z.string() }), "Invite is not pending"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
    [HTTPStatusCodes.FORBIDDEN]: jsonContent(z.object({ error: z.string() }), "Not the space owner"),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(z.object({ error: z.string() }), "Invite not found"),
  },
});

export type RevokeInviteRoute = typeof revokeInvite;

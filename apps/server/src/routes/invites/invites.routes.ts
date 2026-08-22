import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["Invites"];

export const inviteTokenParamSchema = z.object({
  token: z.string().min(16).max(128),
});

export const inviteStatusSchema = z.enum(["pending", "accepted", "expired", "revoked", "declined"]);

export const invitePreviewSchema = z.object({
  spaceName: z.string(),
  invitedByName: z.string(),
  status: inviteStatusSchema,
  expiresAt: z.iso.datetime(),
});

export const preview = createRoute({
  tags,
  path: "/invites/{token}",
  method: "get",
  summary: "Preview a space invite (public)",
  request: {
    params: inviteTokenParamSchema,
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(invitePreviewSchema, "Invite preview"),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(z.object({ error: z.string() }), "Unknown invite"),
  },
});

export type PreviewRoute = typeof preview;

export const inviteActionErrorSchema = z.object({
  error: z.string(),
  code: z.enum(["not_found", "email_mismatch", "expired", "revoked", "declined", "accepted"]),
});

export const accept = createRoute({
  tags,
  path: "/invites/{token}/accept",
  method: "post",
  summary: "Accept a space invite",
  request: {
    params: inviteTokenParamSchema,
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(z.object({ spaceId: z.uuid() }), "Joined the space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
    [HTTPStatusCodes.FORBIDDEN]: jsonContent(inviteActionErrorSchema, "Wrong Google account"),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(inviteActionErrorSchema, "Unknown invite"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(inviteActionErrorSchema, "Invite cannot be accepted"),
  },
});

export type AcceptRoute = typeof accept;

export const decline = createRoute({
  tags,
  path: "/invites/{token}/decline",
  method: "post",
  summary: "Decline a space invite",
  request: {
    params: inviteTokenParamSchema,
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(z.object({ declined: z.literal(true) }), "Invite declined"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
    [HTTPStatusCodes.FORBIDDEN]: jsonContent(inviteActionErrorSchema, "Wrong Google account"),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(inviteActionErrorSchema, "Unknown invite"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(inviteActionErrorSchema, "Invite cannot be declined"),
  },
});

export type DeclineRoute = typeof decline;

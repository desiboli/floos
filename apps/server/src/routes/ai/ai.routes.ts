import { createAiSessionResponseSchema } from "@floos/ai";
import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["AI"];

const errorSchema = z.object({ error: z.string() });

export const refreshTokenResponseSchema = z.object({
  publicAccessToken: z.string(),
});

export const createSession = createRoute({
  tags,
  path: "/ai/session",
  method: "post",
  summary: "Ensure the active-space AI chat and mint a Trigger session token",
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(createAiSessionResponseSchema, "Chat session for the active space"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "No active space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Unauthorized"),
    [HTTPStatusCodes.TOO_MANY_REQUESTS]: jsonContent(errorSchema, "Rate limited"),
    [HTTPStatusCodes.SERVICE_UNAVAILABLE]: jsonContent(errorSchema, "Rate limiter unavailable"),
  },
});

export type CreateSessionRoute = typeof createSession;

export const getSession = createRoute({
  tags,
  path: "/ai/session",
  method: "get",
  summary: "Load the active-space AI chat and messages",
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(createAiSessionResponseSchema, "Existing chat session"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "No active space"),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(errorSchema, "No chat for this space yet"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Unauthorized"),
    [HTTPStatusCodes.TOO_MANY_REQUESTS]: jsonContent(errorSchema, "Rate limited"),
    [HTTPStatusCodes.SERVICE_UNAVAILABLE]: jsonContent(errorSchema, "Rate limiter unavailable"),
  },
});

export type GetSessionRoute = typeof getSession;

export const refreshToken = createRoute({
  tags,
  path: "/ai/session/token",
  method: "post",
  summary: "Mint a fresh Trigger public access token for the active-space chat",
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(refreshTokenResponseSchema, "New public access token"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "No active space"),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(errorSchema, "No chat for this space yet"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Unauthorized"),
    [HTTPStatusCodes.TOO_MANY_REQUESTS]: jsonContent(errorSchema, "Rate limited"),
    [HTTPStatusCodes.SERVICE_UNAVAILABLE]: jsonContent(errorSchema, "Rate limiter unavailable"),
  },
});

export type RefreshTokenRoute = typeof refreshToken;

export const resetSession = createRoute({
  tags,
  path: "/ai/session/reset",
  method: "post",
  summary: "Start a fresh AI chat for the active space (new Trigger session)",
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(createAiSessionResponseSchema, "New chat session"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "No active space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Unauthorized"),
    [HTTPStatusCodes.TOO_MANY_REQUESTS]: jsonContent(errorSchema, "Rate limited"),
    [HTTPStatusCodes.SERVICE_UNAVAILABLE]: jsonContent(errorSchema, "Rate limiter unavailable"),
  },
});

export type ResetSessionRoute = typeof resetSession;

import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["Banking"];

export const createLinkSchema = z.object({
  institutionId: z.string().min(1).openapi({
    example: "SANDBOXFINANCE_SFIN0000",
  }),
  /** App path to return to after bank auth (must start with "/"). */
  origin: z.string().startsWith("/").openapi({
    example: "/onboarding?s=connect-bank",
  }),
});

export const createLinkResponseSchema = z.object({
  redirectUrl: z.url(),
  connectionId: z.uuid(),
});

export const createLink = createRoute({
  tags,
  path: "/banking/link",
  method: "post",
  summary: "Start a bank connection flow",
  request: {
    body: {
      ...jsonContent(createLinkSchema, "Institution and return path"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(
      createLinkResponseSchema,
      "Provider auth URL and pending connection id",
    ),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ error: z.string() }),
      "Invalid request or institution",
    ),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
  },
});

export type CreateLinkRoute = typeof createLink;

export const callback = createRoute({
  tags,
  path: "/banking/callback",
  method: "get",
  summary: "Banking provider AIS callback",
  request: {
    query: z.object({
      /** GoCardless often returns our reference as `ref`. */
      ref: z.string().optional(),
      /** Enable Banking uses `state`. */
      state: z.string().optional(),
      code: z.string().optional(),
      error: z.string().optional(),
      error_description: z.string().optional(),
    }),
  },
  responses: {
    [HTTPStatusCodes.MOVED_TEMPORARILY]: {
      description: "Redirect back to the web app",
    },
  },
});

export type CallbackRoute = typeof callback;

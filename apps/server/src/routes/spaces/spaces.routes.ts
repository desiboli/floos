import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["Spaces"];

export const createSpaceSchema = z.object({
  name: z.string().min(2).max(32),
  country: z.string().length(2),
  currency: z.string().length(3),
});

export const spaceResponseSchema = z.object({
  id: z.string(),
});

export const create = createRoute({
  tags,
  path: "/spaces",
  method: "post",
  summary: "Create a new space",
  request: {
    body: {
      ...jsonContent(createSpaceSchema, "The space to create"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.CREATED]: jsonContent(spaceResponseSchema, "The created space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
  },
});

export type CreateRoute = typeof create;

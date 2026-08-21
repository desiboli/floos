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

export const spaceListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  currency: z.string(),
});

export const listSpacesResponseSchema = z.object({
  spaces: z.array(spaceListItemSchema),
  activeSpaceId: z.uuid().nullable(),
});

export const list = createRoute({
  tags,
  path: "/spaces",
  method: "get",
  summary: "List spaces for the current user",
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(
      listSpacesResponseSchema,
      "The user's spaces and active space id",
    ),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
  },
});

export type ListRoute = typeof list;

export const setActiveSpaceSchema = z.object({
  spaceId: z.uuid(),
});

export const setActive = createRoute({
  tags,
  path: "/spaces/active",
  method: "post",
  summary: "Switch the active space",
  request: {
    body: {
      ...jsonContent(setActiveSpaceSchema, "The space to make active"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(setActiveSpaceSchema, "Active space updated"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(z.object({ error: z.string() }), "Invalid request"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
  },
});

export type SetActiveRoute = typeof setActive;

export const getActive = createRoute({
  tags,
  path: "/spaces/active",
  method: "get",
  summary: "Get the active space",
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(spaceListItemSchema, "The active space"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(z.object({ error: z.string() }), "No active space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
  },
});

export type GetActiveRoute = typeof getActive;

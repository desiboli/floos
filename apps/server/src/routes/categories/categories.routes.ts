import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["Categories"];

const errorSchema = z.object({ error: z.string() });

export const categoryItemSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  system: z.boolean(),
  excluded: z.boolean(),
  parentId: z.uuid().nullable(),
});

export const categoryTreeItemSchema = categoryItemSchema.extend({
  children: z.array(categoryItemSchema),
});

export const listCategoriesResponseSchema = z.object({
  categories: z.array(categoryTreeItemSchema),
});

export const list = createRoute({
  tags,
  path: "/categories",
  method: "get",
  summary: "List categories for the active space",
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(listCategoriesResponseSchema, "Category tree for the active space"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "No active space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Unauthorized"),
  },
});

export type ListRoute = typeof list;

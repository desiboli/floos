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

export const categoryListItemSchema = categoryItemSchema.extend({
  transactionCount: z.number().int().nonnegative(),
});

export const categoryTreeItemSchema = categoryListItemSchema.extend({
  children: z.array(categoryListItemSchema),
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

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  parentId: z.uuid(),
  description: z.string().trim().max(280).optional(),
  color: z.string().trim().min(1).max(32).optional(),
});

export const create = createRoute({
  tags,
  path: "/categories",
  method: "post",
  summary: "Create a user category under a parent in the active space",
  request: {
    body: {
      ...jsonContent(createCategorySchema, "The category to create"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.CREATED]: jsonContent(categoryItemSchema, "The created category"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      "No active space, or parent is missing / not a parent",
    ),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Unauthorized"),
  },
});

export type CreateRoute = typeof create;

const categoryIdParamSchema = z.object({
  id: z.uuid(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  parentId: z.uuid().optional(),
  description: z.string().trim().max(280).nullable().optional(),
  color: z.string().trim().min(1).max(32).nullable().optional(),
});

export const update = createRoute({
  tags,
  path: "/categories/{id}",
  method: "patch",
  summary: "Update a category in the active space",
  request: {
    params: categoryIdParamSchema,
    body: {
      ...jsonContent(updateCategorySchema, "Fields to update"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(categoryItemSchema, "The updated category"),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      "No active space, or parent is missing / not a parent",
    ),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(errorSchema, "Category not found in this space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Unauthorized"),
  },
});

export type UpdateRoute = typeof update;

export const remove = createRoute({
  tags,
  path: "/categories/{id}",
  method: "delete",
  summary: "Delete a user-created category in the active space",
  request: {
    params: categoryIdParamSchema,
  },
  responses: {
    [HTTPStatusCodes.NO_CONTENT]: {
      description: "Category deleted",
    },
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "No active space"),
    [HTTPStatusCodes.FORBIDDEN]: jsonContent(
      errorSchema,
      "System categories and parent groups cannot be deleted",
    ),
    [HTTPStatusCodes.NOT_FOUND]: jsonContent(errorSchema, "Category not found in this space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Unauthorized"),
  },
});

export type RemoveRoute = typeof remove;

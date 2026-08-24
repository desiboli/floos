import { db } from "@floos/db";
import {
  createCategory,
  deleteCategory,
  getActiveSpaceId,
  getCategories,
  updateCategory,
  type CategoryListItem,
  type CreateCategoryError,
  type DeleteCategoryError,
  type UpdateCategoryError,
} from "@floos/db/queries";

import type { AppRouteHandler } from "../../lib/types";
import type { CreateRoute, ListRoute, RemoveRoute, UpdateRoute } from "./categories.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

function toCategoryItem(row: CategoryListItem) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    color: row.color,
    description: row.description,
    system: row.system,
    excluded: row.excluded,
    parentId: row.parentId,
  };
}

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const tree = await getCategories(db, activeSpaceId);

  return c.json(
    {
      categories: tree.map((parent) => ({
        ...toCategoryItem(parent),
        transactionCount: parent.transactionCount,
        children: parent.children.map((child) => ({
          ...toCategoryItem(child),
          transactionCount: child.transactionCount,
        })),
      })),
    },
    HTTPStatusCodes.OK,
  );
};

const createCategoryErrorResponse = {
  "invalid-parent": {
    status: HTTPStatusCodes.BAD_REQUEST,
    error: "Parent category not found in this space",
  },
} as const satisfies Record<CreateCategoryError, { status: 400; error: string }>;

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const body = c.req.valid("json");
  const result = await createCategory(db, {
    spaceId: activeSpaceId,
    name: body.name,
    parentId: body.parentId,
    description: body.description,
    color: body.color,
  });

  if (!result.ok) {
    const { status, error } = createCategoryErrorResponse[result.error];
    return c.json({ error }, status);
  }

  return c.json(toCategoryItem(result.category), HTTPStatusCodes.CREATED);
};

const updateCategoryErrorResponse = {
  "not-found": {
    status: HTTPStatusCodes.NOT_FOUND,
    error: "Category not found",
  },
  "invalid-parent": {
    status: HTTPStatusCodes.BAD_REQUEST,
    error: "Parent category not found in this space",
  },
} as const satisfies Record<UpdateCategoryError, { status: 400 | 404; error: string }>;

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const result = await updateCategory(db, {
    spaceId: activeSpaceId,
    id,
    name: body.name,
    parentId: body.parentId,
    description: body.description,
    color: body.color,
  });

  if (!result.ok) {
    const { status, error } = updateCategoryErrorResponse[result.error];
    return c.json({ error }, status);
  }

  return c.json(toCategoryItem(result.category), HTTPStatusCodes.OK);
};

const deleteCategoryErrorResponse = {
  "not-found": {
    status: HTTPStatusCodes.NOT_FOUND,
    error: "Category not found",
  },
  forbidden: {
    status: HTTPStatusCodes.FORBIDDEN,
    error: "System categories and parent groups cannot be deleted",
  },
} as const satisfies Record<DeleteCategoryError, { status: 403 | 404; error: string }>;

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const result = await deleteCategory(db, { spaceId: activeSpaceId, id });

  if (!result.ok) {
    const { status, error } = deleteCategoryErrorResponse[result.error];
    return c.json({ error }, status);
  }

  return c.body(null, HTTPStatusCodes.NO_CONTENT);
};

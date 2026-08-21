import { db } from "@floos/db";
import {
  createSpace,
  getActiveSpace,
  getActiveSpaceId,
  getSpacesForUser,
  setActiveSpace,
} from "@floos/db/queries";

import type { AppRouteHandler } from "../../lib/types";
import type { CreateRoute, GetActiveRoute, ListRoute, SetActiveRoute } from "./spaces.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const body = c.req.valid("json");

  const spaceId = await createSpace(db, {
    ...body,
    userId: user.id,
  });

  return c.json({ id: spaceId }, HTTPStatusCodes.CREATED);
};

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const [spaces, activeSpaceId] = await Promise.all([
    getSpacesForUser(db, user.id),
    getActiveSpaceId(db, user.id),
  ]);

  return c.json({ spaces, activeSpaceId }, HTTPStatusCodes.OK);
};

export const getActive: AppRouteHandler<GetActiveRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const space = await getActiveSpace(db, user.id);

  if (!space) {
    return c.json({ error: "No active space" }, HTTPStatusCodes.BAD_REQUEST);
  }

  return c.json(space, HTTPStatusCodes.OK);
};

export const setActive: AppRouteHandler<SetActiveRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const { spaceId } = c.req.valid("json");

  try {
    await setActiveSpace(db, user.id, spaceId);
    return c.json({ spaceId }, HTTPStatusCodes.OK);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to switch space";
    return c.json({ error: message }, HTTPStatusCodes.BAD_REQUEST);
  }
};

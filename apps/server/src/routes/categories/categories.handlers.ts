import { db } from "@floos/db";
import { getActiveSpaceId, getCategories } from "@floos/db/queries";

import type { AppRouteHandler } from "../../lib/types";
import type { ListRoute } from "./categories.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const categories = await getCategories(db, activeSpaceId);

  return c.json({ categories }, HTTPStatusCodes.OK);
};

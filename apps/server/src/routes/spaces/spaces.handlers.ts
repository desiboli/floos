import { db } from "@floos/db";
import { createSpace } from "@floos/db/queries";

import type { AppRouteHandler } from "../../lib/types";
import type { CreateRoute } from "./spaces.routes";

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

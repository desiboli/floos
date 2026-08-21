import { db } from "@floos/db";
import { getInstitutions } from "@floos/db/queries";

import type { AppRouteHandler } from "../../lib/types";
import type { ListRoute } from "./institutions.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const { country } = c.req.valid("query");
  const institutions = await getInstitutions(db, country);

  return c.json({ institutions }, HTTPStatusCodes.OK);
};

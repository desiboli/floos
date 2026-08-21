import { auth } from "@floos/auth";
import { createMiddleware } from "hono/factory";

import type { AppBindings } from "../lib/types";

import * as HTTPStatusCodes from "../http-status-codes";

export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
});

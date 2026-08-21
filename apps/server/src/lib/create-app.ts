import { auth } from "@floos/auth";
import { env } from "@floos/env/server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthMiddleware, type BetterAuthInstance } from "evlog/better-auth";
import { createFsDrain } from "evlog/fs";
import { evlog } from "evlog/hono";
import { cors } from "hono/cors";

import type { AppBindings } from "./types";

import notFound from "../middlewares/not-found";
import onError from "../middlewares/on-error";
import defaultHook from "../openapi/default-hook";

const identifyUser = createAuthMiddleware(auth as BetterAuthInstance, {
  exclude: ["/api/auth/**"],
  maskEmail: true,
});

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter();

  app.use(
    evlog({
      drain: process.env.NODE_ENV === "production" ? undefined : createFsDrain(),
    }),
  );
  app.use("*", async (c, next) => {
    await identifyUser(c.get("log"), c.req.raw.headers, c.req.path);
    await next();
  });

  app.use(
    "/*",
    cors({
      origin: env.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  app.notFound(notFound);
  app.onError(onError);

  return app;
}

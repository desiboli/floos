import type { auth } from "@floos/auth";
import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { EvlogVariables } from "evlog/hono";

type Session = typeof auth.$Infer.Session;

export interface AppBindings {
  Bindings: Record<string, never>;
  Variables: EvlogVariables["Variables"] & {
    user?: Session["user"];
    session?: Session["session"];
  };
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;

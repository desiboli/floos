import type { AppRouteHandler } from "../../lib/types";
import type { ListRoute, PatchRoute, PutRoute, RemoveRoute } from "./example.routes";

export const list: AppRouteHandler<ListRoute> = (c) =>
  c.json([
    {
      id: "1",
      name: "Learn Hono",
      done: false,
    },
  ]);

export const put: AppRouteHandler<PutRoute> = (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  return c.json({ id, ...body });
};

export const patch: AppRouteHandler<PatchRoute> = (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  return c.json({
    id,
    name: body.name ?? "Learn Hono",
    done: body.done ?? false,
  });
};

export const remove: AppRouteHandler<RemoveRoute> = (c) => {
  const { id } = c.req.valid("param");
  return c.json({ deleted: true as const, id });
};

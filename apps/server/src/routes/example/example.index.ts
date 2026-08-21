import { createRouter } from "../../lib/create-app";
import * as handlers from "./example.handlers";
import * as routes from "./example.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.put, handlers.put)
  .openapi(routes.patch, handlers.patch)
  .openapi(routes.remove, handlers.remove);

export default router;

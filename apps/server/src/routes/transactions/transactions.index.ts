import { createRouter } from "../../lib/create-app";
import * as handlers from "./transactions.handlers";
import * as routes from "./transactions.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.update, handlers.update);

export default router;

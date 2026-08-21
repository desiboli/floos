import { createRouter } from "../../lib/create-app";
import * as handlers from "./spaces.handlers";
import * as routes from "./spaces.routes";

const router = createRouter()
  .openapi(routes.create, handlers.create)
  .openapi(routes.list, handlers.list)
  .openapi(routes.getActive, handlers.getActive)
  .openapi(routes.setActive, handlers.setActive);

export default router;

import { createRouter } from "../../lib/create-app";
import * as handlers from "./invites.handlers";
import * as routes from "./invites.routes";

const router = createRouter()
  .openapi(routes.accept, handlers.accept)
  .openapi(routes.decline, handlers.decline);

export default router;

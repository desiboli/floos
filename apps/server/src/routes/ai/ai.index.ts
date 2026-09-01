import { createRouter } from "../../lib/create-app";
import * as handlers from "./ai.handlers";
import * as routes from "./ai.routes";

const router = createRouter()
  .openapi(routes.createSession, handlers.createSession)
  .openapi(routes.getSession, handlers.getSession)
  .openapi(routes.refreshToken, handlers.refreshToken)
  .openapi(routes.resetSession, handlers.resetSession);

export default router;

import { createRouter } from "../../lib/create-app";
import * as handlers from "./invites.handlers";
import * as routes from "./invites.routes";

/** Public invite preview; cookie is optional. */
const router = createRouter().openapi(routes.preview, handlers.preview);

export default router;

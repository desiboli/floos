import { createRouter } from "../../lib/create-app";
import * as handlers from "./banking.handlers";
import * as routes from "./banking.routes";

/** Provider redirects land here; cookie may be missing — no requireAuth. */
const router = createRouter().openapi(routes.callback, handlers.callback);

export default router;

import { createRouter } from "../../lib/create-app";
import * as handlers from "./banking.handlers";
import * as routes from "./banking.routes";

const router = createRouter().openapi(routes.createLink, handlers.createLink);

export default router;

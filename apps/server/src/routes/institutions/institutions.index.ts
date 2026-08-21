import { createRouter } from "../../lib/create-app";
import * as handlers from "./institutions.handlers";
import * as routes from "./institutions.routes";

const router = createRouter().openapi(routes.list, handlers.list);

export default router;

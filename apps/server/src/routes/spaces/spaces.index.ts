import { createRouter } from "../../lib/create-app";
import * as handlers from "./spaces.handlers";
import * as routes from "./spaces.routes";

const router = createRouter().openapi(routes.create, handlers.create);

export default router;

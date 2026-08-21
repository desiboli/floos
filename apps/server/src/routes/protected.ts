import { createRouter } from "../lib/create-app";
import { requireAuth } from "../middlewares/auth";
import spacesRoute from "./spaces/spaces.index";

const protectedApp = createRouter();
protectedApp.use("*", requireAuth);

const protectedRoutes = protectedApp.route("/", spacesRoute);

export default protectedRoutes;

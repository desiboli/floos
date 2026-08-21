import { createRouter } from "../lib/create-app";
import { requireAuth } from "../middlewares/auth";
import bankingRoute from "./banking/banking.index";
import institutionsRoute from "./institutions/institutions.index";
import spacesRoute from "./spaces/spaces.index";

const protectedApp = createRouter();
protectedApp.use("*", requireAuth);

const protectedRoutes = protectedApp
  .route("/", spacesRoute)
  .route("/", institutionsRoute)
  .route("/", bankingRoute);

export default protectedRoutes;

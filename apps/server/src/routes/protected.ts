import { createRouter } from "../lib/create-app";
import { requireAuth } from "../middlewares/auth";
import bankingRoute from "./banking/banking.index";
import categoriesRoute from "./categories/categories.index";
import institutionsRoute from "./institutions/institutions.index";
import invitesRoute from "./invites/invites.index";
import spacesRoute from "./spaces/spaces.index";
import transactionsRoute from "./transactions/transactions.index";

const protectedApp = createRouter();
protectedApp.use("*", requireAuth);

const protectedRoutes = protectedApp
  .route("/", spacesRoute)
  .route("/", institutionsRoute)
  .route("/", bankingRoute)
  .route("/", invitesRoute)
  .route("/", transactionsRoute)
  .route("/", categoriesRoute);

export default protectedRoutes;

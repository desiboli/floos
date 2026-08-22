import configureOpenAPI from "./lib/configure-openapi";
import createApp from "./lib/create-app";
import bankingPublicRoute from "./routes/banking/banking.public";
import exampleRoute from "./routes/example/example.index";
import invitesPublicRoute from "./routes/invites/invites.public";
import polarRoute from "./routes/polar/polar.index";
import protectedRoute from "./routes/protected";

const app = createApp();

configureOpenAPI(app);

const routes = app
  .route("/", exampleRoute)
  .route("/", polarRoute)
  // Public routes must be mounted before protectedRoute. That sub-app uses
  // requireAuth on "*", which 401s unauthenticated requests and never falls through.
  .route("/", bankingPublicRoute)
  .route("/", invitesPublicRoute)
  .route("/", protectedRoute)
  .get("/", (c) => c.text("OK"));

export default routes;
export type AppType = typeof routes;

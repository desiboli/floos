import configureOpenAPI from "./lib/configure-openapi";
import createApp from "./lib/create-app";
import bankingPublicRoute from "./routes/banking/banking.public";
import exampleRoute from "./routes/example/example.index";
import polarRoute from "./routes/polar/polar.index";
import protectedRoute from "./routes/protected";

const app = createApp();

configureOpenAPI(app);

const routes = app
  .route("/", exampleRoute)
  .route("/", polarRoute)
  .route("/", protectedRoute)
  .route("/", bankingPublicRoute)
  .get("/", (c) => c.text("OK"));

export default routes;
export type AppType = typeof routes;

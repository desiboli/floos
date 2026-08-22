import { createRouter } from "../../lib/create-app";
import * as handlers from "./banking.handlers";
import * as routes from "./banking.routes";

const router = createRouter()
  .openapi(routes.createLink, handlers.createLink)
  .openapi(routes.listProviderAccounts, handlers.listProviderAccounts)
  .openapi(routes.commitAccounts, handlers.commitAccounts)
  .openapi(routes.toggleBankAccount, handlers.toggleBankAccount);

export default router;

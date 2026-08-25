import { createRouter } from "../../lib/create-app";
import * as handlers from "./banking.handlers";
import * as routes from "./banking.routes";

const router = createRouter()
  .openapi(routes.createLink, handlers.createLink)
  .openapi(routes.reconnectLink, handlers.reconnectLink)
  .openapi(routes.deleteConnection, handlers.deleteConnection)
  .openapi(routes.listConnections, handlers.listConnections)
  .openapi(routes.listProviderAccounts, handlers.listProviderAccounts)
  .openapi(routes.commitAccounts, handlers.commitAccounts)
  .openapi(routes.syncConnection, handlers.syncConnection)
  .openapi(routes.listConnectionTransactions, handlers.listConnectionTransactions)
  .openapi(routes.toggleBankAccount, handlers.toggleBankAccount);

export default router;

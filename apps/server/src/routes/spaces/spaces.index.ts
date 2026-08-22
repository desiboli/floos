import { createRouter } from "../../lib/create-app";
import * as inviteHandlers from "./spaces.invites.handlers";
import * as inviteRoutes from "./spaces.invites.routes";
import * as handlers from "./spaces.handlers";
import * as routes from "./spaces.routes";

const router = createRouter()
  .openapi(routes.create, handlers.create)
  .openapi(routes.list, handlers.list)
  .openapi(inviteRoutes.createInvites, inviteHandlers.createInvites)
  .openapi(inviteRoutes.listInvites, inviteHandlers.listInvites)
  .openapi(inviteRoutes.revokeInvite, inviteHandlers.revoke)
  .openapi(routes.getActive, handlers.getActive)
  .openapi(routes.setActive, handlers.setActive);

export default router;

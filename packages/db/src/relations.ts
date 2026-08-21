import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    spaceMembers: r.many.spaceMembers(),
    activeSpace: r.one.spaces({
      from: r.user.activeSpaceId,
      to: r.spaces.id,
      optional: true,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  spaces: {
    members: r.many.spaceMembers(),
    bankConnections: r.many.bankConnections(),
  },
  spaceMembers: {
    space: r.one.spaces({
      from: r.spaceMembers.spaceId,
      to: r.spaces.id,
      optional: false,
    }),
    user: r.one.user({
      from: r.spaceMembers.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  bankConnections: {
    space: r.one.spaces({
      from: r.bankConnections.spaceId,
      to: r.spaces.id,
      optional: false,
    }),
  },
}));

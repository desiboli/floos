import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    spaceMembers: r.many.spaceMembers(),
    sentInvites: r.many.spaceInvites(),
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
    invites: r.many.spaceInvites(),
    bankConnections: r.many.bankConnections(),
    bankAccounts: r.many.bankAccounts(),
    bankTransactions: r.many.bankTransactions(),
    transactionCategories: r.many.transactionCategories(),
  },
  spaceInvites: {
    space: r.one.spaces({
      from: r.spaceInvites.spaceId,
      to: r.spaces.id,
      optional: false,
    }),
    invitedByUser: r.one.user({
      from: r.spaceInvites.invitedBy,
      to: r.user.id,
      optional: false,
    }),
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
    accounts: r.many.bankAccounts(),
  },
  bankAccounts: {
    connection: r.one.bankConnections({
      from: r.bankAccounts.bankConnectionId,
      to: r.bankConnections.id,
      optional: true,
    }),
    space: r.one.spaces({
      from: r.bankAccounts.spaceId,
      to: r.spaces.id,
      optional: false,
    }),
    transactions: r.many.bankTransactions(),
  },
  bankTransactions: {
    space: r.one.spaces({
      from: r.bankTransactions.spaceId,
      to: r.spaces.id,
      optional: false,
    }),
    account: r.one.bankAccounts({
      from: r.bankTransactions.bankAccountId,
      to: r.bankAccounts.id,
      optional: false,
    }),
  },
  transactionCategories: {
    space: r.one.spaces({
      from: r.transactionCategories.spaceId,
      to: r.spaces.id,
      optional: false,
    }),
    parent: r.one.transactionCategories({
      from: r.transactionCategories.parentId,
      to: r.transactionCategories.id,
      optional: true,
    }),
    children: r.many.transactionCategories(),
  },
}));

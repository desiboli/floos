import { queryOptions } from "@tanstack/react-query";

import { getConnectionTransactions, getProviderAccounts, listBankConnections } from "./api";

export const bankConnectionsQueryOptions = (spaceId: string | null) =>
  queryOptions({
    queryKey: ["banking", "connections", spaceId],
    queryFn: listBankConnections,
    enabled: spaceId !== null,
  });

export const providerAccountsQueryOptions = (connectionId: string) =>
  queryOptions({
    queryKey: ["banking", "provider-accounts", connectionId],
    queryFn: () => getProviderAccounts(connectionId),
    enabled: connectionId.length > 0,
  });

export const connectionTransactionsQueryOptions = (connectionId: string) =>
  queryOptions({
    queryKey: ["banking", "connection-transactions", connectionId],
    queryFn: () => getConnectionTransactions(connectionId),
    enabled: connectionId.length > 0,
  });

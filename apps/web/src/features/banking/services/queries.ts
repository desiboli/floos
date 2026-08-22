import { queryOptions } from "@tanstack/react-query";

import { getConnectionTransactions, getProviderAccounts } from "./api";

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

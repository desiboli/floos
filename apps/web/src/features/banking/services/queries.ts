import { queryOptions } from "@tanstack/react-query";

import { getProviderAccounts } from "./api";

export const providerAccountsQueryOptions = (connectionId: string) =>
  queryOptions({
    queryKey: ["banking", "provider-accounts", connectionId],
    queryFn: () => getProviderAccounts(connectionId),
    enabled: connectionId.length > 0,
  });

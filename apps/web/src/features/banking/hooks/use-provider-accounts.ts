import { useQuery } from "@tanstack/react-query";

import { providerAccountsQueryOptions } from "../services/queries";

export function useProviderAccounts(connectionId: string) {
  return useQuery(providerAccountsQueryOptions(connectionId));
}

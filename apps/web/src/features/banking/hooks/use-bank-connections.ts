import { useQuery } from "@tanstack/react-query";

import { useUserSpaces } from "@/features/spaces/hooks/use-user-spaces";

import { bankConnectionsQueryOptions } from "../services/queries";

export function useBankConnections() {
  const { activeSpaceId } = useUserSpaces();
  const query = useQuery(bankConnectionsQueryOptions(activeSpaceId));

  return {
    ...query,
    connections: query.data?.connections ?? [],
    isPending: activeSpaceId !== null && query.isPending,
  };
}

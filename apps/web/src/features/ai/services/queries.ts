import { queryOptions } from "@tanstack/react-query";

import { getAiSession } from "./api";

export const aiSessionQueryOptions = (spaceId: string | null) =>
  queryOptions({
    queryKey: ["ai", "session", spaceId],
    queryFn: getAiSession,
    enabled: spaceId !== null,
    retry: false,
    staleTime: 45 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

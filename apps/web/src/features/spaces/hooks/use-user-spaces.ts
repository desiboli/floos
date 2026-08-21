import { useQuery } from "@tanstack/react-query";

import { spacesQueryOptions } from "../services/queries";

export function useUserSpaces() {
  const query = useQuery(spacesQueryOptions());
  const spaces = query.data?.spaces ?? [];
  const activeSpaceId = query.data?.activeSpaceId ?? null;
  const activeSpace = spaces.find((space) => space.id === activeSpaceId) ?? null;

  return {
    ...query,
    spaces,
    activeSpaceId,
    activeSpace,
  };
}

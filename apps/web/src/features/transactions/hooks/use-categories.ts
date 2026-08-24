import { useQuery } from "@tanstack/react-query";

import { useUserSpaces } from "@/features/spaces/hooks/use-user-spaces";

import { categoriesQueryOptions } from "../services/queries";

export function useCategories() {
  const { activeSpaceId } = useUserSpaces();
  const query = useQuery(categoriesQueryOptions(activeSpaceId));

  return {
    ...query,
    categories: query.data?.categories ?? [],
    isPending: activeSpaceId !== null && query.isPending,
  };
}

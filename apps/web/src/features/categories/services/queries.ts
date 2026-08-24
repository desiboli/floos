import { queryOptions } from "@tanstack/react-query";

import { getCategories } from "./api";

export const categoriesQueryOptions = (spaceId: string | null) =>
  queryOptions({
    queryKey: ["categories", spaceId] as const,
    queryFn: getCategories,
    enabled: spaceId !== null,
  });

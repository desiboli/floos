import { queryOptions } from "@tanstack/react-query";

import { getInstitutions } from "./api";

export const institutionsQueryOptions = (country: string) =>
  queryOptions({
    queryKey: ["institutions", country],
    queryFn: () => getInstitutions(country),
    enabled: country.length === 2,
    staleTime: 10 * 60 * 1000,
  });

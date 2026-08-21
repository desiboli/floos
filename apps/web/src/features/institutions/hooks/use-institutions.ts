import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { institutionsQueryOptions } from "../services/queries";

export function useInstitutions(country: string) {
  return useQuery({
    ...institutionsQueryOptions(country),
    placeholderData: keepPreviousData,
  });
}

import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { getCategories, getTransactions } from "./api";
import type { TransactionSort } from "./types";

export const TRANSACTIONS_PAGE_SIZE = 50;

export const DEFAULT_TRANSACTION_SORT: TransactionSort = { field: "date", direction: "desc" };

/**
 * Keyed by space and sort: a cursor is only valid within the space and ordering
 * that issued it, so either changing must start a new list.
 */
export const transactionsInfiniteQueryOptions = (spaceId: string | null, sort: TransactionSort) =>
  infiniteQueryOptions({
    queryKey: ["transactions", spaceId, sort.field, sort.direction] as const,
    queryFn: ({ pageParam }) =>
      getTransactions({
        cursor: pageParam,
        pageSize: TRANSACTIONS_PAGE_SIZE,
        sort,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: spaceId !== null,
    refetchInterval: (query) => {
      const hasPending = query.state.data?.pages.some((page) =>
        page.transactions.some((tx) => tx.enrichmentCompletedAt === null),
      );
      return hasPending ? 2000 : false;
    },
  });

export const categoriesQueryOptions = (spaceId: string | null) =>
  queryOptions({
    queryKey: ["categories", spaceId] as const,
    queryFn: getCategories,
    enabled: spaceId !== null,
  });

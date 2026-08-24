import { infiniteQueryOptions } from "@tanstack/react-query";

import { getTransactions } from "./api";
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
  });

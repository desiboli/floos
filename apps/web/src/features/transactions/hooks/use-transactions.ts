import { useInfiniteQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";

import { useUserSpaces } from "@/features/spaces/hooks/use-user-spaces";

import {
  DEFAULT_TRANSACTION_SORT,
  transactionsInfiniteQueryOptions,
} from "../services/queries";
import type { TransactionSort, TransactionSortField } from "../services/types";

/** Columns the list endpoint can order by; the table enables sorting on these only. */
const SORTABLE_FIELDS: readonly TransactionSortField[] = ["date", "amount"];

function toTransactionSort(sorting: SortingState): TransactionSort {
  const [first] = sorting;
  if (!first) return DEFAULT_TRANSACTION_SORT;

  const field = SORTABLE_FIELDS.find((candidate) => candidate === first.id);
  if (!field) return DEFAULT_TRANSACTION_SORT;

  return { field, direction: first.desc ? "desc" : "asc" };
}

export function useTransactions(sorting: SortingState) {
  const { activeSpaceId } = useUserSpaces();
  const query = useInfiniteQuery(
    transactionsInfiniteQueryOptions(activeSpaceId, toTransactionSort(sorting)),
  );
  const transactions = query.data?.pages.flatMap((page) => page.transactions) ?? [];

  return {
    ...query,
    transactions,
    // Without an active space the query never runs, so it would stay pending forever.
    isPending: activeSpaceId !== null && query.isPending,
  };
}

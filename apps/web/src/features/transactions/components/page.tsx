import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@floos/ui/components/empty";
import { Icons } from "@floos/ui/components/icons";
import { Skeleton } from "@floos/ui/components/skeleton";
import type { SortingState } from "@tanstack/react-table";
import { useState } from "react";

import { useTransactions } from "../hooks/use-transactions";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export function TransactionsPage() {
  // Ordering is applied by the server, so it lives above the query.
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const {
    transactions,
    isPending,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTransactions(sorting);

  return (
    <div className="flex h-[calc(100svh-var(--header-height)-2rem)] min-h-0 min-w-0 flex-col overflow-hidden md:h-[calc(100svh-var(--header-height)-4rem)]">
      {isPending ? (
        <TransactionsPageSkeleton />
      ) : isError ? (
        <p className="text-sm text-destructive" role="alert">
          Couldn’t load transactions. Try again in a moment.
        </p>
      ) : transactions.length === 0 ? (
        <Empty className="flex-1 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icons.transactionDollar />
            </EmptyMedia>
            <EmptyTitle>No transactions yet</EmptyTitle>
            <EmptyDescription>
              Connect a bank account to import transactions for this space.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DataTable
          columns={columns}
          data={transactions}
          sorting={sorting}
          onSortingChange={setSorting}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      )}
    </div>
  );
}

function TransactionsPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="ml-auto h-9 w-24" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
        <Skeleton className="h-12 w-full rounded-none" />
        <div className="flex flex-1 flex-col gap-0">
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-12 flex-1 rounded-none" />
        </div>
      </div>
    </div>
  );
}

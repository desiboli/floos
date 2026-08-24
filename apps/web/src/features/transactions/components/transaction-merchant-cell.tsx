import { Skeleton } from "@floos/ui/components/skeleton";

import type { Transaction } from "../services/types";

export function TransactionMerchantCell({ transaction }: { transaction: Transaction }) {
  if (!transaction.merchantName && transaction.enrichmentCompletedAt === null) {
    return <Skeleton className="h-4 w-32" aria-label="Enriching merchant" />;
  }

  return <div className="truncate">{transaction.merchantName ?? transaction.name}</div>;
}

import { api } from "@/lib/api-client";

import type { GetTransactionsParams, TransactionsQuery, TransactionsResult } from "./types";

export async function getTransactions(
  params: GetTransactionsParams = {},
): Promise<TransactionsResult> {
  const query: TransactionsQuery = {};
  if (params.cursor) query.cursor = params.cursor;
  if (params.pageSize != null) query.pageSize = params.pageSize;
  if (params.sort) {
    query.sort = params.sort.field;
    query.direction = params.sort.direction;
  }

  const res = await api.transactions.$get({ query });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to fetch transactions");
  }

  return res.json();
}

export async function getCategories() {
  const res = await api.categories.$get();

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to fetch categories");
  }

  return res.json();
}

export async function updateTransactionCategory(id: string, categorySlug: string) {
  const res = await api.transactions[":id"].$patch({
    param: { id },
    json: { categorySlug },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to update category");
  }

  return res.json();
}

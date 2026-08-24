import type { InferRequestType, InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type TransactionsResult = InferResponseType<typeof api.transactions.$get, 200>;
export type TransactionsQuery = InferRequestType<typeof api.transactions.$get>["query"];
export type Transaction = TransactionsResult["transactions"][number];

export type CategoriesResult = InferResponseType<typeof api.categories.$get, 200>;
export type CategoryTree = CategoriesResult["categories"][number];
export type Category = CategoryTree["children"][number];

export type TransactionSortField = NonNullable<TransactionsQuery["sort"]>;
export type TransactionSortDirection = NonNullable<TransactionsQuery["direction"]>;

export type TransactionSort = {
  field: TransactionSortField;
  direction: TransactionSortDirection;
};

export type GetTransactionsParams = {
  cursor?: string | null;
  pageSize?: number;
  sort?: TransactionSort;
};

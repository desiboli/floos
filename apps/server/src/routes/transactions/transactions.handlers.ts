import { db } from "@floos/db";
import {
  getActiveSpaceId,
  listBankTransactionsForSpace,
  updateTransactionCategory,
  type UpdateTransactionCategoryError,
} from "@floos/db/queries";

import type { AppRouteHandler } from "../../lib/types";
import type { ListRoute, UpdateRoute } from "./transactions.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

function toNumber(value: string | null): number | null {
  if (value == null) return null;
  return Number(value);
}

function toTransactionItem(row: {
  id: string;
  date: string;
  amount: string;
  currency: string;
  name: string;
  description: string | null;
  status: string;
  method: string | null;
  counterpartyName: string | null;
  merchantName: string | null;
  categorySlug: string | null;
  enrichmentCompletedAt: Date | null;
  balance: string | null;
  currencyRate: string | null;
  currencySource: string | null;
  accountName: string;
}) {
  return {
    id: row.id,
    date: row.date,
    amount: Number(row.amount),
    currency: row.currency,
    name: row.name,
    description: row.description,
    status: row.status === "pending" ? ("pending" as const) : ("posted" as const),
    method: row.method,
    counterpartyName: row.counterpartyName,
    merchantName: row.merchantName,
    categorySlug: row.categorySlug,
    enrichmentCompletedAt: row.enrichmentCompletedAt?.toISOString() ?? null,
    balance: toNumber(row.balance),
    currencyRate: toNumber(row.currencyRate),
    currencySource: row.currencySource,
    accountName: row.accountName,
  };
}

const updateTransactionCategoryErrorResponse = {
  "not-found": {
    status: HTTPStatusCodes.NOT_FOUND,
    error: "Transaction not found",
  },
  "invalid-category": {
    status: HTTPStatusCodes.BAD_REQUEST,
    error: "Category not found in this space",
  },
} as const satisfies Record<UpdateTransactionCategoryError, { status: 400 | 404; error: string }>;

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { cursor, pageSize, sort, direction } = c.req.valid("query");

  const result = await listBankTransactionsForSpace(db, {
    spaceId: activeSpaceId,
    cursor,
    pageSize,
    sort,
    direction,
  });

  return c.json(
    {
      transactions: result.transactions.map(toTransactionItem),
      nextCursor: result.nextCursor,
    },
    HTTPStatusCodes.OK,
  );
};

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, HTTPStatusCodes.UNAUTHORIZED);
  }

  const activeSpaceId = await getActiveSpaceId(db, user.id);

  if (!activeSpaceId) {
    return c.json({ error: "No active space set" }, HTTPStatusCodes.BAD_REQUEST);
  }

  const { id } = c.req.valid("param");
  const { categorySlug } = c.req.valid("json");

  const result = await updateTransactionCategory(db, {
    spaceId: activeSpaceId,
    id,
    categorySlug,
  });

  if (!result.ok) {
    const { status, error } = updateTransactionCategoryErrorResponse[result.error];
    return c.json({ error }, status);
  }

  return c.json(toTransactionItem(result.transaction), HTTPStatusCodes.OK);
};

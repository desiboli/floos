import { db } from "@floos/db";
import { getActiveSpaceId, listBankTransactionsForSpace } from "@floos/db/queries";

import type { AppRouteHandler } from "../../lib/types";
import type { ListRoute } from "./transactions.routes";

import * as HTTPStatusCodes from "../../http-status-codes";

function toNumber(value: string | null): number | null {
  if (value == null) return null;
  return Number(value);
}

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
      transactions: result.transactions.map((row) => ({
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
        balance: toNumber(row.balance),
        currencyRate: toNumber(row.currencyRate),
        currencySource: row.currencySource,
        accountName: row.accountName,
      })),
      nextCursor: result.nextCursor,
    },
    HTTPStatusCodes.OK,
  );
};

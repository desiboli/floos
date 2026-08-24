import { TRANSACTION_SORT_FIELDS } from "@floos/db/queries";
import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["Transactions"];

const errorSchema = z.object({ error: z.string() });

/** Amounts, balances, and FX rates are JSON numbers (Drizzle numeric → Number). */
export const transactionItemSchema = z.object({
  id: z.uuid(),
  date: z.string(),
  amount: z.number(),
  currency: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["posted", "pending"]),
  method: z.string().nullable(),
  counterpartyName: z.string().nullable(),
  merchantName: z.string().nullable(),
  balance: z.number().nullable(),
  currencyRate: z.number().nullable(),
  currencySource: z.string().nullable(),
  accountName: z.string(),
});

export const listTransactionsResponseSchema = z.object({
  transactions: z.array(transactionItemSchema),
  nextCursor: z.string().nullable(),
});

export const list = createRoute({
  tags,
  path: "/transactions",
  method: "get",
  summary: "List transactions for the active space",
  request: {
    query: z.object({
      cursor: z.string().optional().openapi({
        example: "2026-04-18|a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        description:
          "Keyset cursor from the previous page (`sortValue|id`). Only valid for the same sort and direction that produced it.",
      }),
      pageSize: z.coerce.number().int().min(1).max(100).optional().openapi({
        example: 50,
        description: "Page size (default 50, max 100)",
      }),
      sort: z.enum(TRANSACTION_SORT_FIELDS).optional().openapi({
        example: "date",
        description: "Column to order by (default `date`)",
      }),
      direction: z.enum(["asc", "desc"]).optional().openapi({
        example: "desc",
        description: "Order direction (default `desc`)",
      }),
    }),
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(
      listTransactionsResponseSchema,
      "Newest transactions for the active space, keyset-paginated",
    ),
    [HTTPStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "No active space"),
    [HTTPStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Unauthorized"),
  },
});

export type ListRoute = typeof list;

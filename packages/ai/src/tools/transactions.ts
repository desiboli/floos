import { db } from "@floos/db";
import {
  getBankTransactionForSpace,
  listBankTransactionsForSpace,
  listEnabledBankAccountSummaries,
} from "@floos/db/queries";
import { tool } from "ai";
import { z } from "zod";

import type { FloosAgentContext } from "../types";
import {
  agentTransactionSchema,
  connectBankHintSchema,
  isoDateSchema,
  toAgentTransaction,
} from "./shared";

const LIST_PAGE_SIZE = 25;

export function transactionsListTool(ctx: FloosAgentContext) {
  return tool({
    description:
      "List individual posted and pending transactions. Do not use this for monthly or category totals — use cash_summary or spending_by_category. Filter by date range, account, category slug, merchant text, and amount. Max 25 per page.",
    inputSchema: z.object({
      from: isoDateSchema.optional(),
      to: isoDateSchema.optional(),
      accountId: z.uuid().optional(),
      categorySlug: z.string().min(1).optional(),
      merchantQuery: z.string().min(1).optional(),
      minAmount: z.number().optional(),
      maxAmount: z.number().optional(),
      cursor: z.string().min(1).optional(),
      pageSize: z.number().int().min(1).max(LIST_PAGE_SIZE).optional(),
    }),
    outputSchema: z.object({
      transactions: z.array(agentTransactionSchema),
      nextCursor: z.string().nullable(),
      hint: connectBankHintSchema,
    }),
    execute: async (input) => {
      if (!ctx.hasBankAccounts) {
        return { transactions: [], nextCursor: null, hint: "connect_bank" as const };
      }

      const accounts = input.accountId
        ? await listEnabledBankAccountSummaries(db, ctx.spaceId)
        : [];
      const accountId =
        input.accountId && accounts.some((account) => account.id === input.accountId)
          ? input.accountId
          : undefined;

      const { transactions, nextCursor } = await listBankTransactionsForSpace(db, {
        spaceId: ctx.spaceId,
        from: input.from,
        to: input.to,
        accountId,
        categorySlug: input.categorySlug,
        merchantQuery: input.merchantQuery,
        minAmount: input.minAmount,
        maxAmount: input.maxAmount,
        cursor: input.cursor,
        pageSize: input.pageSize ?? LIST_PAGE_SIZE,
      });

      return {
        transactions: transactions.map(toAgentTransaction),
        nextCursor,
      };
    },
  });
}

export function transactionGetTool(ctx: FloosAgentContext) {
  return tool({
    description: "Get one transaction by id for the active space. Returns not_found if missing.",
    inputSchema: z.object({
      id: z.uuid(),
    }),
    outputSchema: z.union([
      agentTransactionSchema,
      z.object({ error: z.literal("not_found") }),
    ]),
    execute: async ({ id }) => {
      const row = await getBankTransactionForSpace(db, { spaceId: ctx.spaceId, id });
      if (!row) return { error: "not_found" as const };
      return toAgentTransaction(row);
    },
  });
}

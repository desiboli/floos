import { db } from "@floos/db";
import {
  cashTotalsForSpace,
  listEnabledBankAccountSummaries,
  spendingByCategoryForSpace,
  spendingOverTimeForSpace,
} from "@floos/db/queries";
import { tool } from "ai";
import { z } from "zod";

import type { FloosAgentContext } from "../types";
import { connectBankHintSchema, isoDateSchema, toMoney } from "./shared";

function currentMonthRange(localTimeIso: string) {
  const today = localTimeIso.slice(0, 10);
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

export function spendingByCategoryTool(ctx: FloosAgentContext) {
  return tool({
    description:
      "Preferred tool for largest expenses or spend by category across all enabled accounts. Omit from/to to use the current month. Do not pass an accountId. Do not call accounts_list first. Returns outgoing spend only: total is a positive amount, expenseShare is that category’s percent of expenseTotal.",
    inputSchema: z.object({
      from: isoDateSchema.optional(),
      to: isoDateSchema.optional(),
      includeExcluded: z.boolean().optional(),
    }),
    outputSchema: z.object({
      from: z.string(),
      to: z.string(),
      expenseTotal: z.number(),
      categories: z.array(
        z.object({
          categorySlug: z.string(),
          categoryName: z.string(),
          total: z.number(),
          expenseShare: z.number(),
          currency: z.string(),
          count: z.number(),
        }),
      ),
      hint: connectBankHintSchema,
    }),
    execute: async (input) => {
      const range = currentMonthRange(ctx.localTimeIso);
      const from = input.from ?? range.from;
      const to = input.to ?? range.to;

      if (!ctx.hasBankAccounts) {
        return { from, to, expenseTotal: 0, categories: [], hint: "connect_bank" as const };
      }

      const rows = await spendingByCategoryForSpace(db, {
        spaceId: ctx.spaceId,
        from,
        to,
        includeExcluded: input.includeExcluded ?? false,
      });

      const categories = rows.map((row) => ({
        categorySlug: row.categorySlug ?? "uncategorized",
        categoryName: row.categoryName ?? "Uncategorized",
        total: toMoney(row.total),
        currency: row.currency || ctx.currency,
        count: Number(row.count),
      }));
      const expenseTotal = categories.reduce((sum, category) => sum + category.total, 0);

      return {
        from,
        to,
        expenseTotal,
        categories: categories.map((category) => ({
          ...category,
          expenseShare: expenseTotal > 0 ? Math.round((category.total / expenseTotal) * 100) : 0,
        })),
      };
    },
  });
}

export function spendingOverTimeTool(ctx: FloosAgentContext) {
  return tool({
    description:
      "Income, expenses, and net grouped by month or week for a date range. Expenses are positive magnitudes. Do not invent FX conversions.",
    inputSchema: z.object({
      from: isoDateSchema,
      to: isoDateSchema,
      groupBy: z.enum(["month", "week"]),
    }),
    outputSchema: z.object({
      periods: z.array(
        z.object({
          period: z.string(),
          income: z.number(),
          expenses: z.number(),
          net: z.number(),
          currency: z.string(),
        }),
      ),
      hint: connectBankHintSchema,
    }),
    execute: async (input) => {
      if (!ctx.hasBankAccounts) {
        return { periods: [], hint: "connect_bank" as const };
      }

      const rows = await spendingOverTimeForSpace(db, {
        spaceId: ctx.spaceId,
        from: input.from,
        to: input.to,
        groupBy: input.groupBy,
      });

      return {
        periods: rows.map((row) => ({
          period: row.period,
          income: toMoney(row.income),
          expenses: toMoney(row.expenses),
          net: toMoney(row.net),
          currency: row.currency || ctx.currency,
        })),
      };
    },
  });
}

export function cashSummaryTool(ctx: FloosAgentContext) {
  return tool({
    description:
      "Preferred first tool for 'what did I spend this month/period': income, expenses, and net plus current enabled-account balances. Balances are current, not period-end. Expenses are positive magnitudes.",
    inputSchema: z.object({
      from: isoDateSchema,
      to: isoDateSchema,
    }),
    outputSchema: z.object({
      income: z.number(),
      expenses: z.number(),
      net: z.number(),
      currency: z.string(),
      accountBalances: z.array(
        z.object({
          accountId: z.uuid(),
          name: z.string(),
          balance: z.number(),
          currency: z.string(),
        }),
      ),
      hint: connectBankHintSchema,
    }),
    execute: async (input) => {
      const [totals, accounts] = await Promise.all([
        cashTotalsForSpace(db, {
          spaceId: ctx.spaceId,
          from: input.from,
          to: input.to,
        }),
        listEnabledBankAccountSummaries(db, ctx.spaceId),
      ]);

      if (accounts.length === 0) {
        return {
          income: 0,
          expenses: 0,
          net: 0,
          currency: ctx.currency,
          accountBalances: [],
          hint: "connect_bank" as const,
        };
      }

      return {
        income: toMoney(totals.income),
        expenses: toMoney(totals.expenses),
        net: toMoney(totals.net),
        currency: totals.currency || ctx.currency,
        accountBalances: accounts.map((account) => ({
          accountId: account.id,
          name: account.name,
          balance: toMoney(account.balance),
          currency: account.currency,
        })),
      };
    },
  });
}

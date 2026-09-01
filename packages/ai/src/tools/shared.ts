import { z } from "zod";

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const connectBankHintSchema = z.literal("connect_bank").optional();

export const agentTransactionSchema = z.object({
  id: z.uuid(),
  date: z.string(),
  amount: z.number(),
  currency: z.string(),
  merchantName: z.string().nullable(),
  categorySlug: z.string().nullable(),
  accountName: z.string(),
  status: z.enum(["posted", "pending"]),
});

export type AgentTransaction = z.infer<typeof agentTransactionSchema>;

export function toMoney(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function toAgentTransaction(row: {
  id: string;
  date: string | Date;
  amount: string;
  currency: string;
  name: string;
  counterpartyName: string | null;
  merchantName: string | null;
  categorySlug: string | null;
  accountName: string;
  status: string;
}): AgentTransaction {
  const date = typeof row.date === "string" ? row.date : row.date.toISOString().slice(0, 10);
  return {
    id: row.id,
    date,
    amount: toMoney(row.amount),
    currency: row.currency,
    merchantName: row.merchantName ?? row.counterpartyName ?? row.name,
    categorySlug: row.categorySlug,
    accountName: row.accountName,
    status: row.status === "pending" ? "pending" : "posted",
  };
}

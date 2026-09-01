import { db } from "@floos/db";
import { listEnabledBankAccountSummaries } from "@floos/db/queries";
import { tool } from "ai";
import { z } from "zod";

import type { FloosAgentContext } from "../types";
import { connectBankHintSchema, toMoney } from "./shared";

export function accountsListTool(ctx: FloosAgentContext) {
  return tool({
    description:
      "List enabled bank accounts only when the user asks which accounts they have, or names a specific account you must resolve. Do not call this before spending or cash tools.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      accounts: z.array(
        z.object({
          id: z.uuid(),
          name: z.string(),
          type: z.string(),
          currency: z.string(),
          balance: z.number(),
        }),
      ),
      hint: connectBankHintSchema,
    }),
    execute: async () => {
      const rows = await listEnabledBankAccountSummaries(db, ctx.spaceId);
      if (rows.length === 0) {
        return { accounts: [], hint: "connect_bank" as const };
      }

      return {
        accounts: rows.map((row) => ({
          id: row.id,
          name: row.name,
          type: row.type,
          currency: row.currency,
          balance: toMoney(row.balance),
        })),
      };
    },
  });
}

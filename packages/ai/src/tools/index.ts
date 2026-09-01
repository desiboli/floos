import type { FloosAgentContext } from "../types";
import { accountsListTool } from "./accounts";
import { categoriesListTool } from "./categories";
import { cashSummaryTool, spendingByCategoryTool, spendingOverTimeTool } from "./spending";
import { transactionGetTool, transactionsListTool } from "./transactions";

export function createFloosTools(ctx: FloosAgentContext) {
  return {
    accounts_list: accountsListTool(ctx),
    transactions_list: transactionsListTool(ctx),
    transaction_get: transactionGetTool(ctx),
    categories_list: categoriesListTool(ctx),
    spending_by_category: spendingByCategoryTool(ctx),
    spending_over_time: spendingOverTimeTool(ctx),
    cash_summary: cashSummaryTool(ctx),
  };
}

export type FloosTools = ReturnType<typeof createFloosTools>;

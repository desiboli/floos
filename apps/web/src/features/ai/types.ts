import type { FloosUIMessage } from "@floos/ai";

export type { FloosUIMessage };

export const SUGGESTION_BUCKETS = {
  insights: [
    "What did I spend this month?",
    "How does this month compare to last month?",
  ],
  transactions: ["Show my latest transactions", "Find my largest expenses this month"],
  categories: ["Where did my money go this month?", "How much did I spend on groceries?"],
  accounts: ["What are my account balances?"],
} as const;

export function pickSuggestions(): string[] {
  return Object.values(SUGGESTION_BUCKETS).map((bucket) => {
    const index = Math.floor(Math.random() * bucket.length);
    return bucket[index]!;
  });
}

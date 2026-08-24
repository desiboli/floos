import { AI_CATEGORIES } from "@floos/categories";

export type EnrichmentPromptTransaction = {
  name: string;
  description: string | null;
  counterpartyName: string | null;
  method: string | null;
  amount: string;
  currency: string;
};

function direction(amount: string): "inflow" | "expense" | "zero" {
  const value = Number(amount);
  if (value > 0) return "inflow";
  if (value < 0) return "expense";
  return "zero";
}

function formatRow(tx: EnrichmentPromptTransaction, index: number): string {
  const parts = [
    `Name: "${tx.name}"`,
    `Amount: ${tx.amount} ${tx.currency} (${direction(tx.amount)})`,
  ];

  if (tx.counterpartyName) {
    parts.push(`Counterparty: "${tx.counterpartyName}"`);
  }
  if (tx.description && tx.description !== tx.name) {
    parts.push(`Description: "${tx.description}"`);
  }
  if (tx.method) {
    parts.push(`Method: "${tx.method}"`);
  }

  return `${index + 1}. ${parts.join(" | ")}`;
}

export function generateEnrichmentPrompt(batch: EnrichmentPromptTransaction[]): string {
  const transactionList = batch.map(formatRow).join("\n");
  const slugs = AI_CATEGORIES.join(", ");

  return `You categorize household bank transactions for a family finance app (not business accounting).

For every transaction return:
- merchant: short display name a person would recognize (ICA, Netflix, landlord's name). Title Case. No Inc/LLC/Ltd/Corp. No store numbers or city codes. Null if unknown.
- category: one slug from the allowed list, or null if you are not at least 0.7 confident.
- categoryConfidence and merchantConfidence: 0–1.

Allowed category slugs:
${slugs}

Input hierarchy (use in this order):
1. Counterparty
2. Name (raw bank text)
3. Description

Rules:
- Positive amount = money in (salary, refund, transfer in). Negative = money out.
- Prefer counterparty over the raw name when they disagree.
- Paying your own credit card → credit-card-payment. Moving money between own accounts → internal-transfer. Putting money aside → savings.
- Person-to-person (Swish, friends) → gifts or gifts-received by sign, not other-shopping.
- When unsure, category = null (do not guess other).

Examples:
- "ICA SUPERMARKET 1234" / groceries → merchant "ICA", category groceries
- "NETFLIX.COM" → merchant "Netflix", category streaming
- "LÖN" / counterparty employer, inflow → merchant employer name, category salary
- "CARD PAYMENT AMZN MKTP" → merchant "Amazon", category other-shopping
- Credit-card payoff to your own card → merchant bank/card name, category credit-card-payment
- Transfer between own accounts → merchant account name, category internal-transfer

Return exactly ${batch.length} results in the same order.

Transactions:
${transactionList}`;
}

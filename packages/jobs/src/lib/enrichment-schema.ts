import { AI_CATEGORIES } from "@floos/categories";
import { z } from "zod";

export const enrichmentSchema = z.object({
  merchant: z
    .string()
    .nullable()
    .describe(
      "Short household display name (store, employer, person). No Inc/LLC/Ltd. Null if unknown.",
    ),
  category: z
    .enum(AI_CATEGORIES)
    .nullable()
    .describe("Child category slug. Null if confidence is below 0.7."),
  categoryConfidence: z.number().min(0).max(1).describe("0–1 confidence in the category."),
  merchantConfidence: z.number().min(0).max(1).describe("0–1 confidence in the display name."),
});

export type EnrichmentResult = z.infer<typeof enrichmentSchema>;

export type EnrichmentUpdate = {
  merchantName?: string;
  categorySlug?: string;
};

export const CONFIDENCE_THRESHOLDS = {
  CATEGORY_MIN: 0.7,
  MERCHANT_MIN: 0.6,
} as const;

export function shouldUseCategoryResult(result: EnrichmentResult): boolean {
  return result.category !== null && result.categoryConfidence >= CONFIDENCE_THRESHOLDS.CATEGORY_MIN;
}

export function shouldUseMerchantResult(result: EnrichmentResult): boolean {
  const merchant = result.merchant?.trim();
  return Boolean(merchant) && result.merchantConfidence >= CONFIDENCE_THRESHOLDS.MERCHANT_MIN;
}

/**
 * Fields to write for one row. Caller stamps enrichmentCompletedAt.
 * Never overwrites an existing categorySlug or merchantName.
 */
export function prepareUpdateData(
  transaction: {
    categorySlug: string | null;
    merchantName: string | null;
  },
  result: EnrichmentResult,
): EnrichmentUpdate {
  const update: EnrichmentUpdate = {};

  if (!transaction.merchantName && shouldUseMerchantResult(result)) {
    update.merchantName = result.merchant!.trim();
  }

  if (!transaction.categorySlug) {
    update.categorySlug = shouldUseCategoryResult(result) ? result.category! : "uncategorized";
  }

  return update;
}

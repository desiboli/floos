import { PARENT_CATEGORY_COLORS, type ParentCategorySlug } from "./color-system";
import type { CategoryHierarchy } from "./types";

const RAW_CATEGORIES = [
  {
    slug: "income",
    name: "Income",
    children: [
      { slug: "salary", name: "Salary" },
      { slug: "freelance", name: "Freelance" },
      { slug: "benefits", name: "Benefits" },
      { slug: "interest", name: "Interest" },
      { slug: "gifts-received", name: "Gifts received" },
      { slug: "refunds", name: "Refunds" },
      { slug: "other-income", name: "Other income" },
    ],
  },
  {
    slug: "housing",
    name: "Housing",
    children: [
      { slug: "rent", name: "Rent" },
      { slug: "mortgage", name: "Mortgage" },
      { slug: "utilities", name: "Utilities" },
      { slug: "internet", name: "Internet" },
      { slug: "home-insurance", name: "Home insurance" },
      { slug: "maintenance", name: "Maintenance" },
      { slug: "furniture", name: "Furniture" },
    ],
  },
  {
    slug: "food",
    name: "Food",
    children: [
      { slug: "groceries", name: "Groceries" },
      { slug: "restaurants", name: "Restaurants" },
      { slug: "coffee", name: "Coffee" },
      { slug: "takeaway", name: "Takeaway" },
    ],
  },
  {
    slug: "transport",
    name: "Transport",
    children: [
      { slug: "public-transport", name: "Public transport" },
      { slug: "fuel", name: "Fuel" },
      { slug: "parking", name: "Parking" },
      { slug: "car", name: "Car" },
      { slug: "taxi", name: "Taxi" },
      { slug: "cycling", name: "Cycling" },
    ],
  },
  {
    slug: "health",
    name: "Health",
    children: [
      { slug: "pharmacy", name: "Pharmacy" },
      { slug: "healthcare", name: "Healthcare" },
      { slug: "gym", name: "Gym" },
      { slug: "health-insurance", name: "Health insurance" },
    ],
  },
  {
    slug: "shopping",
    name: "Shopping",
    children: [
      { slug: "clothing", name: "Clothing" },
      { slug: "electronics", name: "Electronics" },
      { slug: "personal-care", name: "Personal care" },
      { slug: "other-shopping", name: "Other shopping" },
    ],
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    children: [
      { slug: "streaming", name: "Streaming" },
      { slug: "going-out", name: "Going out" },
      { slug: "hobbies", name: "Hobbies" },
      { slug: "games", name: "Games" },
    ],
  },
  {
    slug: "travel",
    name: "Travel",
    children: [
      { slug: "flights", name: "Flights" },
      { slug: "accommodation", name: "Accommodation" },
      { slug: "holiday", name: "Holiday" },
    ],
  },
  {
    slug: "family",
    name: "Family",
    children: [
      { slug: "childcare", name: "Childcare" },
      { slug: "school", name: "School" },
      { slug: "kids", name: "Kids" },
      { slug: "pets", name: "Pets" },
      { slug: "gifts", name: "Gifts" },
    ],
  },
  {
    slug: "money",
    name: "Money",
    children: [
      { slug: "savings", name: "Savings" },
      { slug: "investments", name: "Investments" },
      { slug: "loan-repayment", name: "Loan repayment" },
      {
        slug: "credit-card-payment",
        name: "Credit card payment",
        excluded: true,
      },
      { slug: "bank-fees", name: "Bank fees" },
      { slug: "taxes", name: "Taxes" },
      { slug: "insurance", name: "Insurance" },
    ],
  },
  {
    slug: "giving",
    name: "Giving",
    children: [{ slug: "charity", name: "Charity" }],
  },
  {
    slug: "system",
    name: "System",
    children: [
      { slug: "uncategorized", name: "Uncategorized" },
      { slug: "other", name: "Other" },
      { slug: "internal-transfer", name: "Internal transfer", excluded: true },
    ],
  },
] as const satisfies ReadonlyArray<{
  slug: ParentCategorySlug;
  name: string;
  children: ReadonlyArray<{
    slug: string;
    name: string;
    excluded?: boolean;
  }>;
}>;

function applyColors(raw: typeof RAW_CATEGORIES): CategoryHierarchy {
  return raw.map((parent) => {
    const color = PARENT_CATEGORY_COLORS[parent.slug];
    return {
      slug: parent.slug,
      name: parent.name,
      color,
      system: true,
      excluded: false,
      children: parent.children.map((child) => ({
        slug: child.slug,
        name: child.name,
        color,
        system: true,
        excluded: "excluded" in child && child.excluded === true,
        parentSlug: parent.slug,
      })),
    };
  });
}

export const CATEGORIES: CategoryHierarchy = applyColors(RAW_CATEGORIES);

/** Child slugs under Income. */
export const INCOME_CATEGORIES = [
  "salary",
  "freelance",
  "benefits",
  "interest",
  "gifts-received",
  "refunds",
  "other-income",
] as const;

/** Card payoffs and own-account moves — not spending. */
export const EXCLUDED_CATEGORY_SLUGS = ["credit-card-payment", "internal-transfer"] as const;

/**
 * Slugs the LLM may assign. Inflows and expenses.
 * Parents (`income`, `food`, …) stay out — only children.
 */
export const AI_CATEGORIES = [
  ...INCOME_CATEGORIES,
  "rent",
  "mortgage",
  "utilities",
  "internet",
  "home-insurance",
  "maintenance",
  "furniture",
  "groceries",
  "restaurants",
  "coffee",
  "takeaway",
  "public-transport",
  "fuel",
  "parking",
  "car",
  "taxi",
  "cycling",
  "pharmacy",
  "healthcare",
  "gym",
  "health-insurance",
  "clothing",
  "electronics",
  "personal-care",
  "other-shopping",
  "streaming",
  "going-out",
  "hobbies",
  "games",
  "flights",
  "accommodation",
  "holiday",
  "childcare",
  "school",
  "kids",
  "pets",
  "gifts",
  "savings",
  "investments",
  "loan-repayment",
  "credit-card-payment",
  "bank-fees",
  "taxes",
  "insurance",
  "charity",
  "internal-transfer",
  "uncategorized",
  "other",
] as const;

export type AiCategory = (typeof AI_CATEGORIES)[number];

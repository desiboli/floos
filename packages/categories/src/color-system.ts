/** Swatches for custom categories. Hash the slug into this list. */
export const CATEGORY_COLORS = [
  "#3D8B6E",
  "#C4785B",
  "#D4A017",
  "#5B7C99",
  "#4A9B8C",
  "#C47B8A",
  "#7B6B9E",
  "#5B9AA8",
  "#D4896A",
  "#4A5D73",
  "#6B8F71",
  "#8A847A",
  "#B8956C",
  "#8B6B5E",
  "#6A8B7B",
  "#9B7B8A",
] as const;

export const PARENT_CATEGORY_COLORS = {
  income: "#3D8B6E",
  housing: "#C4785B",
  food: "#D4A017",
  transport: "#5B7C99",
  health: "#4A9B8C",
  shopping: "#C47B8A",
  entertainment: "#7B6B9E",
  travel: "#5B9AA8",
  family: "#D4896A",
  money: "#4A5D73",
  giving: "#6B8F71",
  system: "#8A847A",
} as const;

export type ParentCategorySlug = keyof typeof PARENT_CATEGORY_COLORS;

function hashSlug(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) + value.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getColorFromSlug(slug: string): string {
  const index = hashSlug(slug) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index] ?? "#8A847A";
}

export function getCategoryColor(slug: string): string {
  if (slug in PARENT_CATEGORY_COLORS) {
    return PARENT_CATEGORY_COLORS[slug as ParentCategorySlug];
  }
  return getColorFromSlug(slug);
}

export function getAllColors(): readonly string[] {
  return CATEGORY_COLORS;
}

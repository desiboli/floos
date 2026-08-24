import { Button } from "@floos/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@floos/ui/components/dropdown-menu";
import { Skeleton } from "@floos/ui/components/skeleton";
import { useMemo } from "react";

import type { Category, CategoryTree } from "@/features/categories/services/types";

import { CategoryChip } from "@/features/categories/components/category-chip";
import { useCategories } from "@/features/categories/hooks/use-categories";

import type { Transaction } from "../services/types";

import { useUpdateTransactionCategory } from "../hooks/use-update-transaction-category";

function flattenCategories(categories: CategoryTree[]) {
  const bySlug = new Map<string, Category>();
  for (const parent of categories) {
    for (const child of parent.children) {
      bySlug.set(child.slug, child);
    }
  }
  return bySlug;
}

function ColorDot({ color }: { color: string | null }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full bg-muted-foreground"
      style={color ? { backgroundColor: color } : undefined}
      aria-hidden
    />
  );
}

export function TransactionCategoryCell({ transaction }: { transaction: Transaction }) {
  const { categories, isPending } = useCategories();
  const lookup = useMemo(() => flattenCategories(categories), [categories]);
  const { mutate, isPending: isSaving } = useUpdateTransactionCategory();

  if (isPending) {
    return <Skeleton className="h-4 w-20" />;
  }

  const category = transaction.categorySlug ? lookup.get(transaction.categorySlug) : undefined;
  const waitingForEnrichment =
    !transaction.categorySlug && transaction.enrichmentCompletedAt === null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isSaving}
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto max-w-full shrink justify-start px-2 py-1 font-normal"
            aria-label="Change category"
          />
        }
      >
        {waitingForEnrichment ? (
          <Skeleton className="h-4 w-20" aria-label="Enriching category" />
        ) : category ? (
          <CategoryChip name={category.name} color={category.color} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuRadioGroup
          value={transaction.categorySlug ?? ""}
          onValueChange={(slug) => {
            if (!slug || slug === transaction.categorySlug) return;
            mutate({ id: transaction.id, categorySlug: slug });
          }}
        >
          {categories.map((parent) => (
            <DropdownMenuGroup key={parent.slug}>
              <DropdownMenuLabel>{parent.name}</DropdownMenuLabel>
              {parent.children.map((child) => (
                <DropdownMenuRadioItem key={child.slug} value={child.slug}>
                  <ColorDot color={child.color} />
                  {child.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Button } from "@floos/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@floos/ui/components/popover";
import { Skeleton } from "@floos/ui/components/skeleton";
import { useMemo, useState } from "react";

import type { Category, CategoryTree } from "@/features/categories/services/types";

import { CategoryChip } from "@/features/categories/components/category-chip";
import { CategoryPicker } from "@/features/categories/components/category-picker";
import { useCategories } from "@/features/categories/hooks/use-categories";

import type { Transaction } from "../services/types";

import { useUpdateTransactionCategory } from "../hooks/use-update-transaction-category";

function flattenCategories(categories: CategoryTree[]) {
  const bySlug = new Map<string, Category>();
  for (const parent of categories) {
    const { children, ...record } = parent;
    bySlug.set(parent.slug, record);
    for (const child of children) {
      bySlug.set(child.slug, child);
    }
  }
  return bySlug;
}

export function TransactionCategoryCell({ transaction }: { transaction: Transaction }) {
  const { categories, isPending } = useCategories();
  const lookup = useMemo(() => flattenCategories(categories), [categories]);
  const { mutate, isPending: isSaving } = useUpdateTransactionCategory();
  const [open, setOpen] = useState(false);

  if (isPending) {
    return <Skeleton className="h-4 w-20" />;
  }

  const category = transaction.categorySlug ? lookup.get(transaction.categorySlug) : undefined;
  const waitingForEnrichment =
    !transaction.categorySlug && transaction.enrichmentCompletedAt === null;

  const handleSelect = (slug: string) => {
    if (slug !== transaction.categorySlug) {
      mutate({ id: transaction.id, categorySlug: slug });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
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
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-0 overflow-hidden p-0" initialFocus={false}>
        <PopoverTitle className="sr-only">Change category</PopoverTitle>
        <CategoryPicker
          categories={categories}
          onSelect={handleSelect}
          value={transaction.categorySlug}
        />
      </PopoverContent>
    </Popover>
  );
}

import { Button } from "@floos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@floos/ui/components/dialog";
import { Icons } from "@floos/ui/components/icons";

import { useDeleteCategory } from "../hooks/use-category-mutations";
import type { CategoryRecord } from "../services/types";

function deleteWarning(category: CategoryRecord) {
  const count = category.transactionCount;
  if (count <= 0) return null;
  const txn = count === 1 ? "transaction" : "transactions";
  const those = count === 1 ? "That transaction" : "Those transactions";
  return `This category is used by ${count} ${txn}. ${those} will become Uncategorized.`;
}

export function DeleteCategoryDialog({
  category,
  onOpenChange,
}: {
  category: CategoryRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteCategory = useDeleteCategory();
  const warning = category ? deleteWarning(category) : null;

  return (
    <Dialog open={category != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete category</DialogTitle>
          <DialogDescription>
            {category ? `Delete “${category.name}”? This cannot be undone.` : null}
          </DialogDescription>
        </DialogHeader>
        {warning ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            <Icons.alertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{warning}</p>
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={category == null || deleteCategory.isPending}
            onClick={async () => {
              if (!category) return;
              try {
                await deleteCategory.mutateAsync(category.id);
                onOpenChange(false);
              } catch {
                // Toast is handled by the mutation.
              }
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

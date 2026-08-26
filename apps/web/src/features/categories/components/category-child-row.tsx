import { TableCell, TableRow } from "@floos/ui/components/table";

import type { CategoryRecord } from "../services/types";

import { CategoryChip } from "./category-chip";
import { CategoryRowActions } from "./category-row-actions";
import { SystemBadge } from "./system-badge";

export function CategoryChildRow({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryRecord;
  onEdit: (category: CategoryRecord) => void;
  onDelete: (category: CategoryRecord) => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex min-h-9 items-center gap-1.5 pl-10">
          <CategoryChip name={category.name} color={category.color} />
          {category.system ? <SystemBadge /> : null}
        </div>
      </TableCell>
      <TableCell className="max-w-md truncate text-muted-foreground">
        {category.description ?? ""}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {category.transactionCount.toLocaleString()}
      </TableCell>
      <TableCell>
        <CategoryRowActions
          category={category}
          onEdit={onEdit}
          onDelete={category.system ? undefined : onDelete}
        />
      </TableCell>
    </TableRow>
  );
}

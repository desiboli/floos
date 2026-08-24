import { Icons } from "@floos/ui/components/icons";
import { TableCell, TableRow } from "@floos/ui/components/table";
import { cn } from "@floos/ui/lib/utils";

import type { CategoryRecord } from "../services/types";

import { CategoryChip } from "./category-chip";
import { CategoryRowActions } from "./category-row-actions";
import { SystemBadge } from "./system-badge";

export function CategoryParentRow({
  category,
  expanded,
  onToggle,
  onEdit,
}: {
  category: CategoryRecord;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (category: CategoryRecord) => void;
}) {
  return (
    <TableRow className="has-aria-expanded:bg-transparent">
      <TableCell>
        <div className="flex min-h-9 items-center gap-1">
          <button
            type="button"
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center text-muted-foreground"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${category.name}` : `Expand ${category.name}`}
            onClick={onToggle}
          >
            <Icons.chevronRight
              className={cn("size-4 transition-transform", expanded && "rotate-90")}
            />
          </button>
          <CategoryChip name={category.name} color={category.color} />
          {category.system ? <SystemBadge /> : null}
        </div>
      </TableCell>
      <TableCell className="max-w-md truncate text-muted-foreground">
        {category.description ?? ""}
      </TableCell>
      <TableCell>
        <CategoryRowActions category={category} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}

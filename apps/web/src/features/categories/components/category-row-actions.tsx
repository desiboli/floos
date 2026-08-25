import { Button } from "@floos/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@floos/ui/components/dropdown-menu";
import { Icons } from "@floos/ui/components/icons";

import type { CategoryRecord } from "../services/types";

export function CategoryRowActions({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryRecord;
  onEdit: (category: CategoryRecord) => void;
  onDelete?: (category: CategoryRecord) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <Icons.dots className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(category)}>Edit</DropdownMenuItem>
        {onDelete ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(category)}>
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

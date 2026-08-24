import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@floos/ui/components/table";
import { TooltipProvider } from "@floos/ui/components/tooltip";

import type { CategoryRecord, CategoryTree } from "../services/types";

import { CategoryGroupRows } from "./category-group-rows";

export function CategoriesTable({
  tree,
  isSearching,
  collapsedIds,
  onToggle,
  onEdit,
  onDelete,
}: {
  tree: CategoryTree[];
  isSearching: boolean;
  collapsedIds: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (category: CategoryRecord) => void;
  onDelete: (category: CategoryRecord) => void;
}) {
  return (
    <TooltipProvider>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tree.map((parent) => (
              <CategoryGroupRows
                key={parent.id}
                parent={parent}
                expanded={isSearching || !collapsedIds.has(parent.id)}
                onToggle={() => onToggle(parent.id)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

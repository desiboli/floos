import type { CategoryRecord, CategoryTree } from "../services/types";

import { CategoryChildRow } from "./category-child-row";
import { CategoryParentRow } from "./category-parent-row";

export function CategoryGroupRows({
  parent,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  parent: CategoryTree;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (category: CategoryRecord) => void;
  onDelete: (category: CategoryRecord) => void;
}) {
  const { children, ...parentRecord } = parent;

  return (
    <>
      <CategoryParentRow
        category={parentRecord}
        expanded={expanded}
        onToggle={onToggle}
        onEdit={onEdit}
      />
      {expanded
        ? children.map((child) => (
            <CategoryChildRow
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        : null}
    </>
  );
}

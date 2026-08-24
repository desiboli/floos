import { Button } from "@floos/ui/components/button";
import { Icons } from "@floos/ui/components/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@floos/ui/components/input-group";
import { useMemo, useState } from "react";

import type { CategoryRecord, CategoryTree } from "../services/types";

import { useCategories } from "../hooks/use-categories";
import { CategoriesSearchEmpty, CategoriesSetupEmpty } from "./categories-empty";
import { CategoriesPageSkeleton } from "./categories-page-skeleton";
import { CategoriesTable } from "./categories-table";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";

function matchesQuery(category: { name: string; description: string | null }, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    category.name.toLowerCase().includes(q) ||
    (category.description?.toLowerCase().includes(q) ?? false)
  );
}

function filterCategoryTree(tree: CategoryTree[], query: string): CategoryTree[] {
  const q = query.trim();
  if (!q) return tree;

  return tree.flatMap((parent) => {
    const parentHit = matchesQuery(parent, q);
    const children = parentHit
      ? parent.children
      : parent.children.filter((child) => matchesQuery(child, q));
    if (!parentHit && children.length === 0) return [];
    return [{ ...parent, children }];
  });
}

export function CategoriesPage() {
  const { categories, isPending, isError } = useCategories();
  const [search, setSearch] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);

  const filtered = useMemo(() => filterCategoryTree(categories, search), [categories, search]);
  const isSearching = search.trim().length > 0;
  const parents = useMemo(
    () => categories.map((parent) => ({ id: parent.id, name: parent.name, color: parent.color })),
    [categories],
  );

  function toggleCollapsed(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <InputGroup className="max-w-sm flex-1">
          <InputGroupInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
          />
          <InputGroupAddon>
            <Icons.search />
          </InputGroupAddon>
        </InputGroup>
        <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Icons.plus />
          Create
        </Button>
      </div>

      {isPending ? (
        <CategoriesPageSkeleton />
      ) : isError ? (
        <p className="text-sm text-destructive" role="alert">
          Couldn’t load categories. Try again in a moment.
        </p>
      ) : filtered.length === 0 ? (
        isSearching ? (
          <CategoriesSearchEmpty />
        ) : (
          <CategoriesSetupEmpty />
        )
      ) : (
        <CategoriesTable
          tree={filtered}
          isSearching={isSearching}
          collapsedIds={collapsedIds}
          onToggle={toggleCollapsed}
          onEdit={setEditCategory}
          onDelete={setDeleteTarget}
        />
      )}

      <CategoryFormDialog
        key={createOpen ? "create" : "create-closed"}
        open={createOpen}
        onOpenChange={setCreateOpen}
        parents={parents}
      />
      <CategoryFormDialog
        key={editCategory?.id ?? "edit"}
        open={editCategory != null}
        onOpenChange={(open) => {
          if (!open) setEditCategory(null);
        }}
        parents={parents}
        category={editCategory}
      />
      <DeleteCategoryDialog
        category={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

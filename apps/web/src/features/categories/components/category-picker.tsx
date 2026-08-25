import { Input } from "@floos/ui/components/input";
import { cn } from "@floos/ui/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CategoryTree } from "../services/types";

function filterGroups(categories: CategoryTree[], query: string) {
  if (!query) return categories;

  return categories.flatMap((parent) => {
    const parentMatches = parent.name.toLowerCase().includes(query);
    const children = parentMatches
      ? parent.children
      : parent.children.filter((child) => child.name.toLowerCase().includes(query));

    if (!parentMatches && children.length === 0) return [];
    return [{ ...parent, children }];
  });
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

function CategoryOption({
  name,
  color,
  selected,
  className,
  onSelect,
}: {
  name: string;
  color: string | null;
  selected: boolean;
  className?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-active={selected}
      className={cn(
        "flex w-full items-center gap-2 rounded-none py-2 pr-3 pl-3 text-left text-sm outline-none select-none hover:bg-muted data-active:bg-muted",
        className,
      )}
      onClick={onSelect}
    >
      <ColorDot color={color} />
      <span className="min-w-0 flex-1 truncate">{name}</span>
    </button>
  );
}

export function CategoryPicker({
  categories,
  onSelect,
  value,
}: {
  categories: CategoryTree[];
  onSelect: (slug: string) => void;
  value: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim().toLowerCase();
  const groups = useMemo(
    () => filterGroups(categories, trimmedQuery),
    [categories, trimmedQuery],
  );

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="flex max-h-80 flex-col">
      <div className="border-b p-1.5">
        <Input
          ref={inputRef}
          type="search"
          aria-label="Search categories"
          autoComplete="off"
          className="h-9 border-none px-2 shadow-none focus-visible:ring-0"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search categories…"
          value={query}
        />
      </div>
      <ul className="no-scrollbar max-h-64 overflow-y-auto p-1.5" role="listbox">
        {groups.length === 0 ? (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">No categories found</li>
        ) : (
          groups.map((parent) => (
            <li key={parent.slug} className="flex flex-col">
              <CategoryOption
                name={parent.name}
                color={parent.color}
                selected={parent.slug === value}
                onSelect={() => onSelect(parent.slug)}
              />
              {parent.children.map((child) => (
                <CategoryOption
                  key={child.slug}
                  name={child.name}
                  color={child.color}
                  selected={child.slug === value}
                  className="pl-7"
                  onSelect={() => onSelect(child.slug)}
                />
              ))}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

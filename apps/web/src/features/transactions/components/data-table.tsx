import { Button } from "@floos/ui/components/button";
import { Icons } from "@floos/ui/components/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@floos/ui/components/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@floos/ui/components/table";
import { cn } from "@floos/ui/lib/utils";
import {
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type OnChangeFn,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";

import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

import { features, type DataTableFeatures } from "./data-table-features";
import { DataTableViewOptions } from "./data-table-view-options";

const ROW_HEIGHT = 52;

const noop = () => {};

function columnWidthClass(columnId: string) {
  switch (columnId) {
    case "select":
    case "actions":
      return "w-12 shrink-0";
    case "date":
      return "w-28 shrink-0";
    case "name":
      return "min-w-40 flex-1";
    case "categorySlug":
      return "w-44 shrink-0";
    case "description":
      return "min-w-48 flex-1";
    case "accountName":
      return "w-44 shrink-0";
    case "method":
      return "w-36 shrink-0";
    case "status":
      return "w-28 shrink-0";
    case "amount":
      return "w-32 shrink-0";
    default:
      return "min-w-28 shrink-0";
  }
}

type RowWithId = RowData & { id: string };

interface DataTableProps<TData extends RowWithId> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function DataTable<TData extends RowWithId>({
  columns,
  data,
  sorting,
  onSortingChange,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage = noop,
}: DataTableProps<TData>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    status: false,
  });
  const [rowSelection, setRowSelection] = useState({});

  const table = useTable({
    features,
    data,
    columns,
    getRowId: (row) => row.id,
    // Rows arrive already ordered by the list endpoint, and only the loaded
    // pages are in memory, so re-sorting them here would produce a misleading
    // global ordering.
    manualSorting: true,
    onSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // A new ordering means a new list from the first page. Without this the
  // container stays scrolled deep into rows that no longer exist, which lands
  // it at the bottom of the shorter list and immediately pulls another page.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [sorting]);

  const rows = table.getRowModel().rows;
  const isFiltered = columnFilters.length > 0;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  useInfiniteScroll({
    scrollRef,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    // The filter only narrows already-loaded rows, so auto-loading while it is
    // active would walk the whole list looking for matches.
    enabled: !isFiltered,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const showFooterRow = isFetchingNextPage || (hasNextPage && isFiltered);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 pb-4">
        <InputGroup className="max-w-sm">
          <InputGroupInput
            placeholder="Search transactions…"
            aria-label="Search transactions"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
          />
          <InputGroupAddon>
            <Icons.search />
          </InputGroupAddon>
        </InputGroup>
        <DataTableViewOptions table={table} />
      </div>
      <div className="relative min-h-0 min-w-0 flex-1">
        <div
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label="Transactions"
          aria-busy={isFetchingNextPage}
          className="absolute inset-0 overflow-auto overscroll-contain rounded-md border"
        >
          <Table className="grid w-full min-w-max" containerClassName="contents">
            <TableHeader className="sticky top-0 z-10 grid bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="flex w-full hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn("flex items-center", columnWidthClass(header.column.id))}
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody
              className="relative grid"
              style={
                rows.length
                  ? {
                      height: `${rowVirtualizer.getTotalSize() + (showFooterRow ? ROW_HEIGHT : 0)}px`,
                    }
                  : undefined
              }
            >
              {rows.length ? (
                <>
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    if (!row) return null;

                    return (
                      <TableRow
                        key={row.id}
                        data-index={virtualRow.index}
                        data-state={row.getIsSelected() && "selected"}
                        className="absolute top-0 left-0 flex w-full"
                        style={{
                          height: ROW_HEIGHT,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "flex items-center overflow-hidden",
                              columnWidthClass(cell.column.id),
                            )}
                          >
                            <table.FlexRender cell={cell} />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {showFooterRow ? (
                    <TableRow
                      className="absolute top-0 left-0 flex w-full hover:bg-transparent"
                      style={{
                        height: ROW_HEIGHT,
                        transform: `translateY(${rowVirtualizer.getTotalSize()}px)`,
                      }}
                    >
                      <TableCell
                        className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"
                        aria-live="polite"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Icons.loader className="animate-spin" />
                            Loading more…
                          </>
                        ) : (
                          <>
                            Only loaded transactions are searched.
                            <Button variant="ghost" size="sm" onClick={fetchNextPage}>
                              Load more
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </>
              ) : (
                <TableRow className="flex w-full hover:bg-transparent">
                  <TableCell className="flex h-24 flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    No matching transactions.
                    {hasNextPage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchNextPage}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? (
                          <Icons.loader className="animate-spin" data-icon="inline-start" />
                        ) : null}
                        Load more
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

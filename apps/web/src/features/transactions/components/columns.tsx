import { Badge } from "@floos/ui/components/badge";
import { Button } from "@floos/ui/components/button";
import { Checkbox } from "@floos/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@floos/ui/components/dropdown-menu";
import { Icons } from "@floos/ui/components/icons";
import { cn } from "@floos/ui/lib/utils";
import { createColumnHelper } from "@tanstack/react-table";

import { formatAmount } from "@/lib/format";

import type { Transaction } from "../services/types";

import { DataTableColumnHeader } from "./data-table-column-header";
import { type DataTableFeatures } from "./data-table-features";
import { TransactionCategoryCell } from "./transaction-category-cell";
import { TransactionMerchantCell } from "./transaction-merchant-cell";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatTransactionDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

const columnHelper = createColumnHelper<DataTableFeatures, Transaction>();

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("date", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap tabular-nums">
        {formatTransactionDate(row.getValue("date"))}
      </div>
    ),
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <TransactionMerchantCell transaction={row.original} />,
    enableSorting: false,
    filterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) return true;
      const name = row.original.name.toLowerCase();
      const merchant = row.original.merchantName?.toLowerCase() ?? "";
      const description = row.original.description?.toLowerCase() ?? "";
      return name.includes(query) || merchant.includes(query) || description.includes(query);
    },
  }),
  columnHelper.accessor("amount", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = row.original.amount;

      return (
        <div className={cn("tabular-nums font-mono", amount > 0 && "text-success")}>
          {formatAmount(amount, row.original.currency)}
        </div>
      );
    },
  }),
  columnHelper.accessor("categorySlug", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => <TransactionCategoryCell transaction={row.original} />,
    enableSorting: false,
  }),
  columnHelper.accessor("description", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <div className="truncate text-muted-foreground">{row.getValue("description") ?? "—"}</div>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("accountName", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Account" />,
    cell: ({ row }) => <div className="truncate">{row.getValue("accountName")}</div>,
    enableSorting: false,
  }),
  columnHelper.accessor("method", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Method" />,
    cell: ({ row }) => (
      <div className="truncate font-mono text-muted-foreground">
        {row.getValue("method") ?? "—"}
      </div>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.getValue("status") as Transaction["status"];
      return <Badge variant={status === "pending" ? "secondary" : "outline"}>{status}</Badge>;
    },
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const transaction = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <span className="sr-only">Open menu</span>
                <Icons.dots className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(transaction.id)}>
                Copy transaction ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>View details</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);

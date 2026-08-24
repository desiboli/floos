import { columns, type Transaction } from "./columns";
import { DataTable } from "./data-table";

export function TransactionsPage() {
  const data: Transaction[] = [
    {
      id: "722ed22f",
      date: "2026-01-01",
      description: "Test transaction",
      amount: 100,
      category: "Test category",
      account: "Test account",
    },
    {
      id: "728ed52f",
      date: "2026-01-02",
      description: "Test transaction",
      amount: 125,
      category: "Test category",
      account: "Test account",
    },
    {
      id: "489e1d42",
      date: "2026-01-03",
      description: "Test transaction",
      amount: 150,
      category: "Test category",
      account: "Test account",
    },
  ];
  return <DataTable columns={columns} data={data} />;
}

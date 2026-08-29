import type { ColumnDef, Table } from "@tanstack/react-table";

export interface DataTableFilterField<TData> {
  label: string;
  value: keyof TData;
  placeholder?: string;
  variant?: "input" | "select" | "checkbox";
  options?: { label: string; value: string }[];
}

export interface DataTableAction<TData> {
  label: string;
  onClick: (rows: TData[]) => void;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "destructive" | "ghost";
  showSelectedOnly?: boolean;
}

export interface DataTablePageProps<TData, TValue> {
  /** Free-form entity/route label — the old education registry is gone (T22). */
  tableFor: string;
  actions?: DataTableAction<TData>[];
  filterFields?: DataTableFilterField<TData>[];
  enableRowReordering?: boolean;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  table: Table<TData>;
  enableRowReordering?: boolean;
}

export type TableCellRenderer<TData, TValue = unknown> = (
  props: import("@tanstack/react-table").CellContext<TData, TValue>,
) => React.ReactNode;

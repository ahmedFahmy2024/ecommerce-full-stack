"use client";
"use no memo";

import type { ColumnDef, Table, TableState } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { ExtendedColumnSort } from "@/types/data-table";

type ShellInitialState<TData> = Omit<Partial<TableState>, "sorting"> & {
  sorting?: ExtendedColumnSort<TData>[];
};

interface FeatureTableShellProps<TData> {
  data: TData[];
  pageCount: number;
  columns: ColumnDef<TData>[];
  actionBar?: (table: Table<TData>) => ReactNode;
  toolbarExtras?: (table: Table<TData>) => ReactNode;
  isExtraFiltered?: boolean;
  onExtraReset?: () => void;
  initialState?: ShellInitialState<TData>;
}

const DEFAULT_INITIAL_STATE = {
  sorting: [] as ExtendedColumnSort<unknown>[],
  columnPinning: { right: ["actions"] as string[] },
};

export function FeatureTableShell<TData>({
  data,
  pageCount,
  columns,
  actionBar,
  toolbarExtras,
  isExtraFiltered,
  onExtraReset,
  initialState,
}: FeatureTableShellProps<TData>) {
  const mergedInitialState: ShellInitialState<TData> = {
    sorting: (initialState?.sorting ??
      DEFAULT_INITIAL_STATE.sorting) as ExtendedColumnSort<TData>[],
    ...initialState,
    columnPinning:
      initialState?.columnPinning ?? DEFAULT_INITIAL_STATE.columnPinning,
  };

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: mergedInitialState,
    queryKeys: { perPage: "limit" },
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <DataTable table={table} actionBar={actionBar?.(table)}>
      <DataTableToolbar
        table={table}
        isExtraFiltered={isExtraFiltered}
        onExtraReset={onExtraReset}
      >
        {toolbarExtras?.(table)}
        <DataTableSortList table={table} align="end" />
      </DataTableToolbar>
    </DataTable>
  );
}

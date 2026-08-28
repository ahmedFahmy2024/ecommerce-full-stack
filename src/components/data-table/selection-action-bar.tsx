"use client";
"use no memo";

import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";

interface SelectionActionBarProps<TData> {
  table: Table<TData>;
  label: (count: number) => string;
  children: ReactNode;
}

export function SelectionActionBar<TData>({
  table,
  label,
  children,
}: SelectionActionBarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  if (!selectedRows.length) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-sm">
      <span className="text-muted-foreground text-sm">
        {label(selectedRows.length)}
      </span>
      <Separator orientation="vertical" className="h-4" />
      {children}
    </div>
  );
}

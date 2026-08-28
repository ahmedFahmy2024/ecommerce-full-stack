"use client";
"use no memo";

import type { Row, Table } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { SelectionActionBar } from "@/components/data-table/selection-action-bar";
import { Button } from "@/components/ui/button";

interface EntityTableActionBarProps<TData> {
  table: Table<TData>;
  label: (count: number) => string;
  deleteLabel?: string;
  onDelete?: (rows: Row<TData>[]) => void;
  children?: ReactNode;
}

export function EntityTableActionBar<TData>({
  table,
  label,
  deleteLabel,
  onDelete,
  children,
}: EntityTableActionBarProps<TData>) {
  function handleDelete() {
    const rows = table.getFilteredSelectedRowModel().rows;
    if (onDelete) {
      onDelete(rows);
      return;
    }
    table.toggleAllRowsSelected(false);
  }

  return (
    <SelectionActionBar table={table} label={label}>
      {deleteLabel && (
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 />
          {deleteLabel}
        </Button>
      )}
      {children}
    </SelectionActionBar>
  );
}

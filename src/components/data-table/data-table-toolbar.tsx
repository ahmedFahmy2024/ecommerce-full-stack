"use client";

import type { Column, Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import * as React from "react";

import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTableSliderFilter } from "@/components/data-table/data-table-slider-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  isExtraFiltered?: boolean;
  onExtraReset?: () => void;
}

export function DataTableToolbar<TData>({
  table,
  isExtraFiltered,
  onExtraReset,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  "use no memo";
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    table.getState().sorting.length > 0;

  const columns = table
    .getAllColumns()
    .filter((column) => column.getCanFilter());

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
    table.resetSorting();
    onExtraReset?.();
  }, [table, onExtraReset]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-1",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {(isFiltered || isExtraFiltered) && (
          <Button
            aria-label="Reset filters"
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={onReset}
          >
            <X />
            Reset
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} align="end" />
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  "use no memo";
  {
    const columnMeta = column.columnDef.meta;

    const onFilterRender = React.useCallback(() => {
      if (!columnMeta?.variant) return null;

      switch (columnMeta.variant) {
        case "text":
          return (
            <DataTableTextFilter
              column={column}
              placeholder={columnMeta.placeholder ?? columnMeta.label}
            />
          );

        case "number":
          return (
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder={columnMeta.placeholder ?? columnMeta.label}
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className={cn("h-8 w-[120px]", columnMeta.unit && "pr-8")}
              />
              {columnMeta.unit && (
                <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                  {columnMeta.unit}
                </span>
              )}
            </div>
          );

        case "range":
          return (
            <DataTableSliderFilter
              column={column}
              title={columnMeta.label ?? column.id}
            />
          );

        case "date":
        case "dateRange":
          return (
            <DataTableDateFilter
              column={column}
              title={columnMeta.label ?? column.id}
              multiple={columnMeta.variant === "dateRange"}
            />
          );

        case "select":
        case "multiSelect":
          return (
            <DataTableFacetedFilter
              column={column}
              title={columnMeta.label ?? column.id}
              options={columnMeta.options ?? []}
              multiple={columnMeta.variant === "multiSelect"}
            />
          );

        case "boolean": {
          const isActive =
            (column.getFilterValue() as string[] | undefined)?.[0] === "true";
          return (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "border-dashed font-normal",
                isActive && "border-solid bg-accent",
              )}
              onClick={() =>
                column.setFilterValue(isActive ? undefined : ["true"])
              }
            >
              {columnMeta.label ?? column.id}
            </Button>
          );
        }

        default:
          return null;
      }
    }, [column, columnMeta]);

    return onFilterRender();
  }
}

interface DataTableTextFilterProps<TData> {
  column: Column<TData>;
  placeholder?: string;
  debounceMs?: number;
}

function DataTableTextFilter<TData>({
  column,
  placeholder,
  debounceMs = 500,
}: DataTableTextFilterProps<TData>) {
  const filterValue = (column.getFilterValue() as string) ?? "";
  const [value, setValue] = React.useState(filterValue);
  const lastPropagated = React.useRef(filterValue);

  React.useEffect(() => {
    if (filterValue !== lastPropagated.current) {
      lastPropagated.current = filterValue;
      setValue(filterValue);
    }
  }, [filterValue]);

  const debouncedSetFilter = useDebouncedCallback((next: string) => {
    lastPropagated.current = next;
    column.setFilterValue(next);
  }, debounceMs);

  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(event) => {
        const next = event.target.value;
        setValue(next);
        debouncedSetFilter(next);
      }}
      className="h-8 w-40 lg:w-56"
    />
  );
}

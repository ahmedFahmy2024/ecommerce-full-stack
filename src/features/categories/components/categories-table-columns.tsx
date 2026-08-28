"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { EntityRowActions } from "@/components/data-table/entity-row-actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { routes } from "@/constants/routes";
import type {
  DataTableRowAction,
  TableActionsConfig,
} from "@/types/data-table";
import type { Category } from "../types";

type T = ReturnType<typeof useTranslations<"Categories">>;

interface GetColumnsProps {
  t: T;
  setRowAction: (action: DataTableRowAction<Category> | null) => void;
  actions: TableActionsConfig;
}

export function getColumns({
  t,
  setRowAction,
  actions,
}: GetColumnsProps): ColumnDef<Category>[] {
  const hasRowActions = actions.view || actions.edit || actions.delete;

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
    },
    {
      id: "search",
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.title")} />
      ),
      cell: ({ row }) => (
        <span className="block max-w-64 truncate">{row.original.title}</span>
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: t("filters.search"),
        variant: "text",
        placeholder: t("filters.searchPlaceholder"),
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.status")} />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? t("status.active") : t("status.inactive")}
          </Badge>
        );
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: t("columns.status"),
        variant: "select",
        options: [
          { label: t("status.active"), value: "active" },
          { label: t("status.inactive"), value: "inactive" },
        ],
        apiKey: "status",
      },
    },
    {
      accessorKey: "createdAt",
      header: t("columns.createdAt"),
      cell: ({ row }) => {
        const val = row.getValue<string>("createdAt");
        if (!val) return "—";
        return new Date(val).toLocaleDateString();
      },
      enableSorting: false,
    },
    ...(hasRowActions
      ? [
          {
            id: "actions",
            cell: ({ row }: { row: Row<Category> }) => (
              <EntityRowActions
                row={row}
                setRowAction={setRowAction}
                actions={actions}
                getId={(c) => c.id}
                routes={{
                  view: routes.categories.view,
                  edit: routes.categories.edit,
                }}
                labels={{
                  view: t("actions.view"),
                  edit: t("actions.edit"),
                  delete: t("actions.delete"),
                }}
              />
            ),
            enableSorting: false,
            enableHiding: false,
          } satisfies ColumnDef<Category>,
        ]
      : []),
  ];
}

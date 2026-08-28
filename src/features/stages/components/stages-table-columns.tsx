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
import type { Stage } from "../types";

type T = ReturnType<typeof useTranslations<"Stages">>;

interface GetColumnsProps {
  t: T;
  setRowAction: (action: DataTableRowAction<Stage> | null) => void;
  actions: TableActionsConfig;
}

export function getColumns({
  t,
  setRowAction,
  actions,
}: GetColumnsProps): ColumnDef<Stage>[] {
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
      id: "category",
      accessorKey: "category",
      header: t("columns.category"),
      cell: ({ row }) => {
        const cat = row.original.category;
        if (!cat) return "—";
        return <span>{cat.title.ar || cat.title.en}</span>;
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.status")} />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        const isActive = status === "active";
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? t("status.active") : t("status.not_active")}
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
          { label: t("status.not_active"), value: "not_active" },
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
            cell: ({ row }: { row: Row<Stage> }) => (
              <EntityRowActions
                row={row}
                setRowAction={setRowAction}
                actions={actions}
                getId={(s) => s.id}
                routes={{
                  view: routes.stages.view,
                  edit: routes.stages.edit,
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
          } satisfies ColumnDef<Stage>,
        ]
      : []),
  ];
}

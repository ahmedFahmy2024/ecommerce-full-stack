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
import type { Material } from "../types";

type T = ReturnType<typeof useTranslations<"Materials">>;

interface GetColumnsProps {
  t: T;
  setRowAction: (action: DataTableRowAction<Material> | null) => void;
  actions: TableActionsConfig;
}

export function getColumns({
  t,
  setRowAction,
  actions,
}: GetColumnsProps): ColumnDef<Material>[] {
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.name")} />
      ),
      cell: ({ row }) => (
        <span className="block max-w-64 truncate">{row.original.name}</span>
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
        const active = row.getValue<boolean>("status");
        return (
          <Badge variant={active ? "default" : "secondary"}>
            {active ? t("status.active") : t("status.inactive")}
          </Badge>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      id: "material_type",
      accessorKey: "materialType",
      header: t("columns.materialType"),
      cell: ({ row }) => {
        const val = row.original.materialContents?.[0]?.type ?? "—";
        return val;
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: t("columns.materialType"),
        variant: "select",
        options: [
          { label: t("materialType.SUBJECT"), value: "subject" },
          { label: t("materialType.COMMUNITY"), value: "community" },
          { label: t("materialType.QURAN"), value: "quran" },
        ],
        apiKey: "material_type",
      },
    },
    {
      id: "material_detail_type",
      accessorKey: "materialDetailType",
      header: t("columns.materialDetailType"),
      cell: () => "—",
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: t("columns.materialDetailType"),
        variant: "select",
        options: [
          { label: t("materialDetailType.LIVE"), value: "live" },
          { label: t("materialDetailType.RECORDED"), value: "recorded" },
          {
            label: t("materialDetailType.RECORDED_LIMIT"),
            value: "recorded_limit",
          },
          { label: t("materialDetailType.BOTH"), value: "both" },
          { label: t("materialDetailType.PRESENCE"), value: "presence" },
        ],
        apiKey: "material_detail_type",
      },
    },
    {
      accessorKey: "sessionsCount",
      header: t("columns.sessionsCount"),
      cell: ({ row }) => row.getValue("sessionsCount"),
      enableSorting: false,
    },
    {
      accessorKey: "classesCount",
      header: t("columns.classesCount"),
      cell: ({ row }) => row.getValue("classesCount"),
      enableSorting: false,
    },
    {
      accessorKey: "startDate",
      header: t("columns.startDate"),
      cell: ({ row }) => {
        const val = row.getValue<string>("startDate");
        if (!val) return "—";
        return new Date(val).toLocaleDateString();
      },
      enableSorting: false,
    },
    {
      accessorKey: "endDate",
      header: t("columns.endDate"),
      cell: ({ row }) => {
        const val = row.getValue<string>("endDate");
        if (!val) return "—";
        return new Date(val).toLocaleDateString();
      },
      enableSorting: false,
    },

    ...(hasRowActions
      ? [
          {
            id: "actions",
            cell: ({ row }: { row: Row<Material> }) => (
              <EntityRowActions
                row={row}
                setRowAction={setRowAction}
                actions={actions}
                getId={(m) => m.id}
                routes={{
                  view: routes.materials.view,
                  edit: routes.materials.edit,
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
          } satisfies ColumnDef<Material>,
        ]
      : []),
  ];
}

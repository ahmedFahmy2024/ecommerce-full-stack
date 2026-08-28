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
  Option,
  TableActionsConfig,
} from "@/types/data-table";
import type { Class } from "../types";

type T = ReturnType<typeof useTranslations<"Classes">>;

interface GetColumnsProps {
  t: T;
  setRowAction: (action: DataTableRowAction<Class> | null) => void;
  actions: TableActionsConfig;
  materialOptions: Option[];
  isMaterialsLoading?: boolean;
  onMaterialsOpen?: () => void;
}

export function getColumns({
  t,
  setRowAction,
  actions,
  materialOptions,
  isMaterialsLoading,
  onMaterialsOpen,
}: GetColumnsProps): ColumnDef<Class>[] {
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
      accessorKey: "displayName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.name")} />
      ),
      cell: ({ row }) => (
        <span className="block max-w-64 truncate">
          {row.original.displayName}
        </span>
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
      accessorKey: "category",
      header: t("columns.category"),
      cell: ({ row }) => row.original.category.title,
      enableSorting: false,
    },
    {
      accessorKey: "stage",
      header: t("columns.stage"),
      cell: ({ row }) => row.original.stage.title,
      enableSorting: false,
    },
    {
      accessorKey: "batch",
      header: t("columns.batch"),
      cell: ({ row }) => row.original.batch.title,
      enableSorting: false,
    },
    {
      id: "gender",
      accessorKey: "gender",
      header: t("columns.gender"),
      cell: ({ row }) => {
        const gender = row.getValue<Class["gender"]>("gender");
        return <Badge variant="outline">{t(`gender.${gender}`)}</Badge>;
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: t("columns.gender"),
        variant: "multiSelect",
        options: [
          { label: t("gender.male"), value: "male" },
          { label: t("gender.female"), value: "female" },
          { label: t("gender.both"), value: "both" },
        ],
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.status")} />
      ),
      cell: ({ row }) => {
        const status = row.getValue<Class["status"]>("status");
        const variantMap: Record<
          Class["status"],
          "default" | "secondary" | "destructive" | "outline"
        > = {
          active: "default",
          not_active: "secondary",
          deleted: "destructive",
          pending: "outline",
          finished: "secondary",
        };
        return (
          <Badge variant={variantMap[status]}>{t(`status.${status}`)}</Badge>
        );
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: t("columns.status"),
        variant: "multiSelect",
        options: [
          { label: t("status.active"), value: "active" },
          { label: t("status.not_active"), value: "not_active" },
          { label: t("status.deleted"), value: "deleted" },
          { label: t("status.pending"), value: "pending" },
          { label: t("status.finished"), value: "finished" },
        ],
      },
    },
    {
      accessorKey: "usersCount",
      header: t("columns.usersCount"),
      cell: ({ row }) => row.getValue("usersCount"),
      enableSorting: false,
    },
    {
      accessorKey: "materials",
      header: t("columns.materialsCount"),
      cell: ({ row }) => row.original.statistics.materialsCount,
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.createdAt")} />
      ),
      cell: ({ row }) => {
        const raw = row.getValue<string>("createdAt");
        if (!raw) return null;
        return new Date(`${raw}Z`).toLocaleDateString();
      },
      enableSorting: true,
    },
    {
      id: "materialId",
      accessorKey: "id",
      header: t("filters.materialId"),
      cell: () => null,
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: {
        label: t("filters.materialId"),
        variant: "select",
        options: materialOptions,
        isLoading: isMaterialsLoading,
        onOpen: onMaterialsOpen,
      },
    },
    ...(hasRowActions
      ? [
          {
            id: "actions",
            cell: ({ row }: { row: Row<Class> }) => (
              <EntityRowActions
                row={row}
                setRowAction={setRowAction}
                actions={actions}
                getId={(cls) => cls.id}
                routes={{
                  view: routes.classes.view,
                  edit: routes.classes.edit,
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
          } satisfies ColumnDef<Class>,
        ]
      : []),
  ];
}

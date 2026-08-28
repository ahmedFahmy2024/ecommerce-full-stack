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
import type { User } from "../types";

type T = ReturnType<typeof useTranslations<"Users">>;

interface GetColumnsProps {
  t: T;
  setRowAction: (action: DataTableRowAction<User> | null) => void;
  actions: TableActionsConfig;
}

export function getColumns({
  t,
  setRowAction,
  actions,
}: GetColumnsProps): ColumnDef<User>[] {
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
      accessorKey: "fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.fullName")} />
      ),
      cell: ({ row }) => (
        <span className="block max-w-48 truncate">{row.original.fullName}</span>
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
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.email")} />
      ),
      cell: ({ row }) => (
        <span className="block max-w-48 truncate">{row.getValue("email")}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "phone",
      header: t("columns.phone"),
      cell: ({ row }) => row.getValue("phone"),
      enableSorting: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.status")} />
      ),
      cell: ({ row }) => {
        const status = row.getValue<User["status"]>("status");
        const variantMap: Record<
          User["status"],
          "default" | "secondary" | "destructive"
        > = {
          active: "default",
          inactive: "secondary",
          banned: "destructive",
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
          { label: t("status.inactive"), value: "inactive" },
          { label: t("status.banned"), value: "banned" },
        ],
      },
    },
    {
      accessorKey: "gender",
      header: t("columns.gender"),
      cell: ({ row }) => {
        const gender = row.getValue<User["gender"]>("gender");
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
        ],
      },
    },
    {
      accessorKey: "countryName",
      header: t("columns.country"),
      cell: ({ row }) => row.getValue("countryName"),
      enableSorting: false,
    },
    {
      accessorKey: "roles",
      header: t("columns.roles"),
      cell: ({ row }) => {
        const roles = row.getValue<User["roles"]>("roles");
        if (!roles.length)
          return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role.id} variant="secondary" className="text-xs">
                {role.name.en}
              </Badge>
            ))}
          </div>
        );
      },
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
      id: "onlyWithoutParent",
      accessorKey: "userParentId",
      header: t("filters.onlyWithoutParent"),
      cell: () => null,
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: {
        label: t("filters.onlyWithoutParent"),
        variant: "boolean",
      },
    },
    {
      id: "onlyChildren",
      accessorKey: "userParentId",
      header: t("filters.onlyChildren"),
      cell: () => null,
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: {
        label: t("filters.onlyChildren"),
        variant: "boolean",
      },
    },
    ...(hasRowActions
      ? [
          {
            id: "actions",
            cell: ({ row }: { row: Row<User> }) => (
              <EntityRowActions
                row={row}
                setRowAction={setRowAction}
                actions={actions}
                getId={(u) => u.id}
                routes={{
                  view: routes.users.view,
                  edit: routes.users.edit,
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
          } satisfies ColumnDef<User>,
        ]
      : []),
  ];
}

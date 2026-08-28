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
import type { Role } from "../types";

type T = ReturnType<typeof useTranslations<"Roles">>;

interface GetColumnsProps {
  t: T;
  setRowAction: (action: DataTableRowAction<Role> | null) => void;
  actions: TableActionsConfig;
}

function getRoleName(name: Role["name"]) {
  if (typeof name === "string") return name;
  return name.en || name.ar;
}

export function getColumns({
  t,
  setRowAction,
  actions,
}: GetColumnsProps): ColumnDef<Role>[] {
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
        <span className="block max-w-64 truncate">
          {getRoleName(row.original.name)}
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
      id: "guardName",
      accessorKey: "guardName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.guardName")} />
      ),
      cell: ({ row }) => {
        const guardName = row.getValue<Role["guardName"]>("guardName");
        return <Badge variant="outline">{guardName}</Badge>;
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: t("columns.guardName"),
        variant: "multiSelect",
        options: [
          { label: t("guardName.admin"), value: "admin" },
          { label: t("guardName.user"), value: "user" },
        ],
      },
    },
    {
      accessorKey: "permissions",
      header: t("columns.permissions"),
      cell: ({ row }) => {
        const permissions = row.original.permissions ?? [];
        if (!permissions.length)
          return <span className="text-muted-foreground">—</span>;
        const visible = permissions.slice(0, 3);
        const extra = permissions.length - visible.length;
        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((p) => (
              <Badge key={p.id} variant="secondary" className="text-xs">
                {p.permissionType}
              </Badge>
            ))}
            {extra > 0 && (
              <Badge variant="outline" className="text-xs">
                +{extra}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    ...(hasRowActions
      ? [
          {
            id: "actions",
            cell: ({ row }: { row: Row<Role> }) => (
              <EntityRowActions
                row={row}
                setRowAction={setRowAction}
                actions={actions}
                getId={(r) => r.id}
                routes={{
                  edit: routes.roles.edit,
                  view: routes.roles.view,
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
          } satisfies ColumnDef<Role>,
        ]
      : []),
  ];
}

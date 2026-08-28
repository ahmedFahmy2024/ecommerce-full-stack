"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DeleteRowDialog } from "@/components/data-table/delete-row-dialog";
import { EntityTableActionBar } from "@/components/data-table/entity-table-action-bar";
import { FeatureTableShell } from "@/components/data-table/feature-table-shell";
import { ROLES_DELETE } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";
import type {
  DataTableRowAction,
  TableActionsConfig,
} from "@/types/data-table";
import type { Role } from "../types";
import { getColumns } from "./roles-table-columns";

interface RolesTableProps {
  promises: Promise<[PaginatedResponse<Role>]>;
  actions: TableActionsConfig;
}

export function RolesTable({ promises, actions }: RolesTableProps) {
  "use no memo";
  const t = useTranslations("Roles");
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Role> | null>(null);

  const [{ items, meta }] = React.use(promises);

  const columns = React.useMemo(
    () => getColumns({ t, setRowAction, actions }),
    [t, actions],
  );

  return (
    <>
      <FeatureTableShell
        data={items}
        pageCount={meta.totalPages}
        columns={columns}
        actionBar={(table) => (
          <EntityTableActionBar
            table={table}
            label={(count) => t("actionBar.selected", { count })}
            deleteLabel={t("actionBar.delete")}
          />
        )}
      />

      {actions.delete && (
        <DeleteRowDialog
          open={rowAction?.variant === "delete"}
          onOpenChange={(open) => {
            if (!open) setRowAction(null);
          }}
          row={rowAction?.variant === "delete" ? rowAction.row : null}
          endpointName={ROLES_DELETE}
          getId={(role) => role.id}
        />
      )}
    </>
  );
}

export function RolesTableFallback() {
  return (
    <DataTableSkeleton
      columnCount={4}
      rowCount={10}
      filterCount={2}
      withViewOptions
      withPagination
    />
  );
}

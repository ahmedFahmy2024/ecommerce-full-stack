"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DeleteRowDialog } from "@/components/data-table/delete-row-dialog";
import { EntityTableActionBar } from "@/components/data-table/entity-table-action-bar";
import { FeatureTableShell } from "@/components/data-table/feature-table-shell";
import { MATERIALS_DELETE } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";
import type {
  DataTableRowAction,
  TableActionsConfig,
} from "@/types/data-table";
import type { Material } from "../types";
import { getColumns } from "./materials-table-columns";

interface MaterialsTableProps {
  promise: Promise<PaginatedResponse<Material>>;
  actions: TableActionsConfig;
}

export function MaterialsTable({ promise, actions }: MaterialsTableProps) {
  "use no memo";
  const t = useTranslations("Materials");
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Material> | null>(null);

  const { items, meta } = React.use(promise);

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
        initialState={{
          columnVisibility: {
            material_detail_type: false,
          },
        }}
      />

      {actions.delete && (
        <DeleteRowDialog
          open={rowAction?.variant === "delete"}
          onOpenChange={(open) => {
            if (!open) setRowAction(null);
          }}
          row={rowAction?.variant === "delete" ? rowAction.row : null}
          endpointName={MATERIALS_DELETE}
          getId={(m) => m.id}
        />
      )}
    </>
  );
}

export function MaterialsTableFallback() {
  return (
    <DataTableSkeleton
      columnCount={10}
      rowCount={10}
      filterCount={3}
      withViewOptions
      withPagination
    />
  );
}

"use client";

import { useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";

import { ActionDrawer } from "@/components/data-table/action-drawer";
import { CreateButton } from "@/components/data-table/create-button";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DeleteRowDialog } from "@/components/data-table/delete-row-dialog";
import { EntityDrawerContent } from "@/components/data-table/entity-drawer-content";
import { EntityTableActionBar } from "@/components/data-table/entity-table-action-bar";
import { FeatureTableShell } from "@/components/data-table/feature-table-shell";
import { useMaterialsOptions } from "@/features/materials/hooks/use-materials-options";
import { CLASSES_DELETE } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  DataTableRowAction,
  TableActionsConfig,
} from "@/types/data-table";
import type { Class } from "../types";
import { ClassForm } from "./class-form";
import { getColumns } from "./classes-table-columns";

interface ClassesTableProps {
  promise: Promise<PaginatedResponse<Class>>;
  actions: TableActionsConfig;
}

const DRAWER_TITLES = {
  create: "Create Class",
  update: "Edit Class",
  view: "View Class",
};

const hasDrawerMode = (actions: TableActionsConfig) =>
  actions.createMode === "drawer" ||
  actions.editMode === "drawer" ||
  actions.viewMode === "drawer";

export function ClassesTable({ promise, actions }: ClassesTableProps) {
  "use no memo";
  const t = useTranslations("Classes");
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Class> | null>(null);

  const [materialId] = useQueryState(
    "materialId",
    parseAsString.withDefault(""),
  );
  const [materialsEnabled, setMaterialsEnabled] = React.useState(
    () => materialId !== "",
  );
  const enableMaterials = React.useCallback(
    () => setMaterialsEnabled(true),
    [],
  );

  const { items, meta } = React.use(promise);
  const { data: materialOptions = [], isLoading: isMaterialsLoading } =
    useMaterialsOptions(materialsEnabled);

  const columns = React.useMemo(
    () =>
      getColumns({
        t,
        setRowAction,
        actions,
        materialOptions,
        isMaterialsLoading,
        onMaterialsOpen: enableMaterials,
      }),
    [t, actions, materialOptions, isMaterialsLoading, enableMaterials],
  );

  const isDrawerOpen = rowAction !== null && rowAction.variant !== "delete";
  const closeDrawer = () => setRowAction(null);

  function handleDrawerOpenChange(open: boolean) {
    if (!open) setRowAction(null);
  }

  const toolbarCreate =
    actions.create && actions.createMode === "drawer"
      ? () => (
          <CreateButton
            label={t("actions.create")}
            onClick={() => setRowAction({ row: null, variant: "create" })}
          />
        )
      : undefined;

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
        toolbarExtras={toolbarCreate}
        initialState={{
          columnVisibility: {
            materialId: false,
          },
        }}
      />

      {hasDrawerMode(actions) && (
        <ActionDrawer
          rowAction={isDrawerOpen ? rowAction : null}
          onOpenChange={handleDrawerOpenChange}
          titles={DRAWER_TITLES}
          renderContent={(variant, row) => (
            <EntityDrawerContent<Class, Class>
              variant={variant}
              row={row}
              detailEndpoint={null}
              getId={(c) => c.id}
              renderForm={(detail) => (
                <ClassForm cls={detail} onSuccess={closeDrawer} />
              )}
              renderView={(cls) => (
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <span className="font-medium">Name (EN):</span>{" "}
                    {cls.name.en}
                  </div>
                  <div>
                    <span className="font-medium">Name (AR):</span>{" "}
                    {cls.name.ar}
                  </div>
                  <div>
                    <span className="font-medium">Gender:</span> {cls.gender}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {cls.status}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>{" "}
                    {cls.category?.title}
                  </div>
                  <div>
                    <span className="font-medium">Stage:</span>{" "}
                    {cls.stage?.title}
                  </div>
                  <div>
                    <span className="font-medium">Batch:</span>{" "}
                    {cls.batch?.title}
                  </div>
                  {cls.telegram_code && (
                    <div>
                      <span className="font-medium">Telegram Code:</span>{" "}
                      {cls.telegram_code}
                    </div>
                  )}
                  {cls.limit_sound !== null && (
                    <div>
                      <span className="font-medium">Limit Sound:</span>{" "}
                      {cls.limit_sound}
                    </div>
                  )}
                </div>
              )}
            />
          )}
        />
      )}

      {actions.delete && (
        <DeleteRowDialog
          open={rowAction?.variant === "delete"}
          onOpenChange={(open) => {
            if (!open) setRowAction(null);
          }}
          row={rowAction?.variant === "delete" ? rowAction.row : null}
          endpointName={CLASSES_DELETE}
          getId={(cls) => cls.id}
        />
      )}
    </>
  );
}

export function ClassesTableFallback() {
  return (
    <DataTableSkeleton
      columnCount={11}
      rowCount={10}
      filterCount={3}
      withViewOptions
      withPagination
    />
  );
}

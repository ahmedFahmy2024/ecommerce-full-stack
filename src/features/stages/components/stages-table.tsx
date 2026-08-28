"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import { ActionDrawer } from "@/components/data-table/action-drawer";
import { CreateButton } from "@/components/data-table/create-button";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DeleteRowDialog } from "@/components/data-table/delete-row-dialog";
import { EntityDrawerContent } from "@/components/data-table/entity-drawer-content";
import { EntityTableActionBar } from "@/components/data-table/entity-table-action-bar";
import { FeatureTableShell } from "@/components/data-table/feature-table-shell";
import { Badge } from "@/components/ui/badge";
import { STAGES_DELETE, STAGES_DETAILS } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";
import type {
  DataTableRowAction,
  TableActionsConfig,
} from "@/types/data-table";
import type { Stage, StageDetail } from "../types";
import { StageForm } from "./stage-form";
import { getColumns } from "./stages-table-columns";

interface StagesTableProps {
  promise: Promise<PaginatedResponse<Stage>>;
  actions: TableActionsConfig;
}

const DRAWER_TITLES = {
  create: "Create Stage",
  update: "Edit Stage",
  view: "View Stage",
};

const hasDrawerMode = (actions: TableActionsConfig) =>
  actions.createMode === "drawer" ||
  actions.editMode === "drawer" ||
  actions.viewMode === "drawer";

export function StagesTable({ promise, actions }: StagesTableProps) {
  "use no memo";
  const t = useTranslations("Stages");
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Stage> | null>(null);

  const { items, meta } = React.use(promise);

  const columns = React.useMemo(
    () => getColumns({ t, setRowAction, actions }),
    [t, actions],
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
      />

      {hasDrawerMode(actions) && (
        <ActionDrawer
          rowAction={isDrawerOpen ? rowAction : null}
          onOpenChange={handleDrawerOpenChange}
          titles={DRAWER_TITLES}
          renderContent={(variant, row) => (
            <EntityDrawerContent<Stage, StageDetail>
              variant={variant}
              row={row}
              detailEndpoint={STAGES_DETAILS}
              getId={(s) => s.id}
              renderForm={(detail) => (
                <StageForm stage={detail} onSuccess={closeDrawer} />
              )}
              renderView={(detail) => {
                const catTitle = detail.category
                  ? detail.category.title.ar || detail.category.title.en
                  : "—";
                return (
                  <div className="flex flex-col gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Title (English)</p>
                      <p className="font-medium">{detail.title.en || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Title (Arabic)</p>
                      <p className="font-medium">{detail.title.ar || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{catTitle}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          detail.status === "active" ? "default" : "secondary"
                        }
                      >
                        {detail.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created At</p>
                      <p className="font-medium">
                        {new Date(detail.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              }}
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
          endpointName={STAGES_DELETE}
          getId={(s) => s.id}
        />
      )}
    </>
  );
}

export function StagesTableFallback() {
  return (
    <DataTableSkeleton
      columnCount={6}
      rowCount={10}
      filterCount={2}
      withViewOptions
      withPagination
    />
  );
}

"use client";

import * as React from "react";
import type { Row } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

import { ActionDrawer } from "@/components/data-table/action-drawer";
import { CreateButton } from "@/components/data-table/create-button";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DeleteRowDialog } from "@/components/data-table/delete-row-dialog";
import { EntityTableActionBar } from "@/components/data-table/entity-table-action-bar";
import { FeatureTableShell } from "@/components/data-table/feature-table-shell";
import { USERS_DELETE } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";
import type {
  DataTableRowAction,
  TableActionsConfig,
} from "@/types/data-table";
import type { User } from "../types";
import { getColumns } from "./users-table-columns";

interface UsersTableProps {
  promises: Promise<[PaginatedResponse<User>]>;
  actions: TableActionsConfig;
}

const DRAWER_TITLES = {
  create: "Create User",
  update: "Edit User",
  view: "View User",
};

// Drawer content lives here — inside the client boundary, never passed from server.
// Replace each case with the real form/view component when ready.
function renderDrawerContent(
  variant: "create" | "update" | "view",
  row: Row<User> | null,
) {
  switch (variant) {
    case "create":
      return (
        <p className="text-muted-foreground text-sm">
          Create user form goes here.
        </p>
      );
    case "update":
      return (
        <p className="text-muted-foreground text-sm">
          Edit user form for ID{" "}
          <span className="font-mono">{row?.original.id}</span> goes here.
        </p>
      );
    case "view":
      return (
        <p className="text-muted-foreground text-sm">
          View details for ID{" "}
          <span className="font-mono">{row?.original.id}</span> goes here.
        </p>
      );
  }
}

const hasDrawerMode = (actions: TableActionsConfig) =>
  actions.createMode === "drawer" ||
  actions.editMode === "drawer" ||
  actions.viewMode === "drawer";

export function UsersTable({ promises, actions }: UsersTableProps) {
  "use no memo";
  const t = useTranslations("Users");
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<User> | null>(null);

  const [{ items, meta }] = React.use(promises);

  const columns = React.useMemo(
    () => getColumns({ t, setRowAction, actions }),
    [t, actions],
  );

  const isDrawerOpen = rowAction !== null && rowAction.variant !== "delete";

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
            onlyWithoutParent: false,
            onlyChildren: false,
          },
        }}
      />

      {hasDrawerMode(actions) && (
        <ActionDrawer
          rowAction={isDrawerOpen ? rowAction : null}
          onOpenChange={handleDrawerOpenChange}
          titles={DRAWER_TITLES}
          renderContent={renderDrawerContent}
        />
      )}

      {actions.delete && (
        <DeleteRowDialog
          open={rowAction?.variant === "delete"}
          onOpenChange={(open) => {
            if (!open) setRowAction(null);
          }}
          row={rowAction?.variant === "delete" ? rowAction.row : null}
          endpointName={USERS_DELETE}
          getId={(user) => user.id}
        />
      )}
    </>
  );
}

export function UsersTableFallback() {
  return (
    <DataTableSkeleton
      columnCount={9}
      rowCount={10}
      filterCount={3}
      withViewOptions
      withPagination
    />
  );
}

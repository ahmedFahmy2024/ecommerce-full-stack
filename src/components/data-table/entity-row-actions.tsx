"use client";

import type { Row } from "@tanstack/react-table";

import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import type {
  DataTableRowAction,
  TableActionsConfig,
} from "@/types/data-table";

interface EntityRowActionsProps<TData> {
  row: Row<TData>;
  setRowAction: (action: DataTableRowAction<TData> | null) => void;
  actions: TableActionsConfig;
  getId: (data: TData) => string;
  routes: { view: (id: string) => string; edit: (id: string) => string };
  labels: { view: string; edit: string; delete: string };
}

export function EntityRowActions<TData>({
  row,
  setRowAction,
  actions,
  getId,
  routes,
  labels,
}: EntityRowActionsProps<TData>) {
  const router = useRouter();

  const hasViewEdit = actions.view || actions.edit;
  const hasDelete = actions.delete;

  function handleView() {
    if (actions.viewMode === "drawer") {
      setRowAction({ row, variant: "view" });
    } else {
      router.push(routes.view(getId(row.original)));
    }
  }

  function handleEdit() {
    if (actions.editMode === "drawer") {
      setRowAction({ row, variant: "update" });
    } else {
      router.push(routes.edit(getId(row.original)));
    }
  }

  return (
    <RowActionsMenu>
      {actions.view && (
        <DropdownMenuItem onClick={handleView}>{labels.view}</DropdownMenuItem>
      )}
      {actions.edit && (
        <DropdownMenuItem onClick={handleEdit}>{labels.edit}</DropdownMenuItem>
      )}
      {hasViewEdit && hasDelete && <DropdownMenuSeparator />}
      {actions.delete && (
        <DropdownMenuItem
          onClick={() => setRowAction({ row, variant: "delete" })}
          className="text-destructive focus:text-destructive"
        >
          {labels.delete}
        </DropdownMenuItem>
      )}
    </RowActionsMenu>
  );
}

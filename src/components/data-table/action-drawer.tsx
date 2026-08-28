"use client";

import type { Row } from "@tanstack/react-table";
import { type ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DataTableRowAction } from "@/types/data-table";

interface ActionDrawerProps<TData> {
  rowAction: DataTableRowAction<TData> | null;
  onOpenChange: (open: boolean) => void;
  titles?: {
    create?: string;
    update?: string;
    view?: string;
  };
  renderContent: (
    variant: "create" | "update" | "view",
    row: Row<TData> | null,
  ) => ReactNode;
}

const DRAWER_VARIANTS = new Set(["create", "update", "view"] as const);

export function ActionDrawer<TData>({
  rowAction,
  onOpenChange,
  titles,
  renderContent,
}: ActionDrawerProps<TData>) {
  const isDrawerVariant =
    rowAction !== null &&
    DRAWER_VARIANTS.has(rowAction.variant as "create" | "update" | "view");

  const variant = isDrawerVariant
    ? (rowAction!.variant as "create" | "update" | "view")
    : null;

  const title = variant ? (titles?.[variant] ?? defaultTitle(variant)) : "";

  return (
    <Sheet open={isDrawerVariant} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        className="flex flex-col gap-0 p-0 sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {variant !== null && renderContent(variant, rowAction?.row ?? null)}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function defaultTitle(variant: "create" | "update" | "view"): string {
  switch (variant) {
    case "create":
      return "Create";
    case "update":
      return "Edit";
    case "view":
      return "View";
  }
}

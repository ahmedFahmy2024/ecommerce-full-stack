"use client";

import { FilterIcon, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdvancedFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  applyLabel: string;
  resetLabel: string;
  activeCount: number;
  onApply: () => void;
  onReset: () => void;
  children: ReactNode;
}

export function AdvancedFilterSheet({
  open,
  onOpenChange,
  title,
  applyLabel,
  resetLabel,
  activeCount,
  onApply,
  onReset,
  children,
}: AdvancedFilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative h-8 font-normal"
        >
          <FilterIcon className="text-muted-foreground" />
          {title}
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-6 p-4">{children}</div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2 border-t px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onReset}
            disabled={activeCount === 0}
          >
            <RotateCcw />
            {resetLabel}
          </Button>
          <Button size="sm" className="flex-1" onClick={onApply}>
            <FilterIcon />
            {applyLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="shrink-0 text-sm font-normal text-foreground">
        {label}
      </Label>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormFooterLabels {
  create: string;
  creating: string;
  update: string;
  updating: string;
  cancel: string;
}

interface FormFooterProps {
  isSubmitting: boolean;
  isEdit: boolean;
  labels: FormFooterLabels;
  onCancel?: () => void;
  align?: "start" | "end";
  className?: string;
}

export function FormFooter({
  isSubmitting,
  isEdit,
  labels,
  onCancel,
  align = "start",
  className,
}: FormFooterProps) {
  const submitText = isSubmitting
    ? isEdit
      ? labels.updating
      : labels.creating
    : isEdit
      ? labels.update
      : labels.create;

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        align === "end" && "justify-end",
        className,
      )}
    >
      <Button type="submit" disabled={isSubmitting}>
        {submitText}
      </Button>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          {labels.cancel}
        </Button>
      )}
    </div>
  );
}

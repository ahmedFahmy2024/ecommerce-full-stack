"use client";

import type { Row } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "@/i18n/navigation";
import apiClient from "@/services/api";

interface DeleteRowDialogProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: Row<TData> | null;
  endpointName: string;
  getId: (data: TData) => string | number;
  onSuccess?: () => void;
}

export function DeleteRowDialog<TData>({
  open,
  onOpenChange,
  row,
  endpointName,
  getId,
  onSuccess,
}: DeleteRowDialogProps<TData>) {
  const t = useTranslations("Common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!row) return;
    startTransition(async () => {
      await apiClient(endpointName, {
        params: { id: getId(row.original) },
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
          router.refresh();
        },
      });
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("deleteDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("deleteDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

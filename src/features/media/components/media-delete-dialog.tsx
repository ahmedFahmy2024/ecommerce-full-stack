"use client";

import { Loader2, Trash2 } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteMedia } from "@/features/media/hooks/use-delete-media";
import { ApiClientError } from "@/services/api/contracts";
import type { MediaResource } from "@/services/api/media";

interface MediaDeleteDialogProps {
  row: Pick<MediaResource, "id" | "originalName"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Routine soft-delete confirmation (T30) — `DELETE /media/:id`.
 *
 * Deliberately the calm, routine flow (contrast with `MediaPurgeDialog`,
 * which is the only destructive flow): the stored file is kept, the deletion
 * stays reversible until the retention window ends, and no reference check
 * runs — attachments stay valid. The gallery is active-rows-only, so the
 * item disappears from the list once the server confirms and the list
 * refetches (no optimistic update). A repeat delete of the same id surfaces
 * the backend's honest 404 verbatim.
 */
export function MediaDeleteDialog({
  row,
  open,
  onOpenChange,
}: MediaDeleteDialogProps) {
  const { mutate, reset, isPending, isError, isSuccess, error } =
    useDeleteMedia();

  // Fresh state per opening — a stale error from a previous row must never
  // bleed into the next confirmation. `reset` is stable (React Query).
  React.useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  // Close only on confirmed success; errors keep the dialog open.
  React.useEffect(() => {
    if (isSuccess) onOpenChange(false);
  }, [isSuccess, onOpenChange]);

  if (!row) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>
            Remove “{row.originalName}” from the gallery?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The item disappears from the media gallery, but the stored file is
            kept and stays recoverable until the retention window ends. Products
            and avatars that still reference it keep working — no references are
            checked or changed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isError ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-destructive text-sm"
          >
            {error instanceof ApiClientError
              ? error.message
              : "Something went wrong. Please try again."}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              // Keep the dialog open; it closes on confirmed success.
              event.preventDefault();
              mutate(row.id);
            }}
          >
            {isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending ? "Removing…" : "Remove from gallery"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

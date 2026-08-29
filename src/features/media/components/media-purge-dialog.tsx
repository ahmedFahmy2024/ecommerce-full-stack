"use client";

import { Flame, Loader2, ShieldAlert } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePurgeMedia } from "@/features/media/hooks/use-purge-media";
import { ApiClientError } from "@/services/api/contracts";
import type { MediaResource } from "@/services/api/media";

/** Rows that can be purged (gallery rows and purge-blocked maintenance rows). */
export type PurgeableMediaRow = Pick<
  MediaResource,
  "id" | "originalName" | "mimeType" | "url"
>;

interface MediaPurgeDialogProps {
  row: PurgeableMediaRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Irreversible purge confirmation (T30) — `DELETE /media/:id/purge`.
 *
 * Visually and structurally distinct from the routine soft-delete dialog
 * (never a shared "delete" flow): destructive iconography, a required
 * acknowledgment checkbox before the confirm button enables, and copy that
 * says exactly what is destroyed — the stored file AND the database row,
 * with no undo.
 *
 * A reference-blocked 409 (`ApiClientError`, preserved by `errors.ts`) is
 * rendered inside the dialog: nothing was destroyed and the message (backend
 * localized per `x-lang`) plus any structured details name the surfaces
 * still referencing the asset.
 */
export function MediaPurgeDialog({
  row,
  open,
  onOpenChange,
}: MediaPurgeDialogProps) {
  const [acknowledged, setAcknowledged] = React.useState(false);
  const { mutate, reset, isPending, isError, isSuccess, error } =
    usePurgeMedia();

  // Fresh, un-acknowledged state per opening — an irreversible confirmation
  // must never survive from a previous attempt.
  React.useEffect(() => {
    if (open) {
      reset();
      setAcknowledged(false);
    }
  }, [open, reset]);

  React.useEffect(() => {
    if (isSuccess) onOpenChange(false);
  }, [isSuccess, onOpenChange]);

  if (!row) return null;

  const conflictError =
    isError && error instanceof ApiClientError && error.status === 409
      ? error
      : null;
  const conflictDetails = Array.isArray(conflictError?.details)
    ? conflictError.details.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="ring-destructive/30 data-[state=open]:ring-destructive/40">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <ShieldAlert className="text-destructive" aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-destructive">
            Permanently purge “{row.originalName}”?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This destroys the stored file <strong>and</strong> its database row.
            There is <strong>no undo</strong> — unlike removing from the
            gallery, the retention window cannot bring this back. Every surface
            that displays it will show a broken image.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <Checkbox
            id="media-purge-acknowledge"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="media-purge-acknowledge"
            className="font-normal text-sm leading-snug"
          >
            I understand this permanently destroys the file and the row with no
            way to recover them.
          </Label>
        </div>

        {conflictError ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-destructive text-sm"
          >
            <p className="font-medium">
              Purge blocked — this asset is still referenced. Nothing was
              destroyed.
            </p>
            <p className="mt-1">{conflictError.message}</p>
            {conflictDetails.length > 0 ? (
              <ul className="mt-1 list-disc pl-5">
                {conflictDetails.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : isError ? (
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
            disabled={!acknowledged || isPending}
            onClick={(event) => {
              // Keep the dialog open; it closes on confirmed success.
              event.preventDefault();
              mutate(row.id);
            }}
          >
            {isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Flame aria-hidden="true" />
            )}
            {isPending ? "Purging…" : "Purge permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

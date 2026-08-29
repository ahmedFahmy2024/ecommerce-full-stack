"use client";

import { Flame, Loader2, ShieldX } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePurgeBlockedMedia } from "@/features/media/hooks/use-purge-blocked-media";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/lib/format";
import { ApiClientError } from "@/services/api/contracts";
import type { PurgeBlockedMediaResource } from "@/services/api/media";

interface MediaPurgeBlockedListProps {
  /** Opens the shared irreversible purge confirmation for a row. */
  onPurge: (row: PurgeBlockedMediaResource) => void;
}

/**
 * Purge-blocked maintenance list (T30) — `GET /media/purge-blocked`.
 *
 * Rows the retention sweep could not collect: soft-deleted, past the
 * retention window, still referenced. A healthy system has zero of these.
 *
 * ## Visibility is UX-only; the backend stays authoritative
 *
 * The section is hidden when `usePermissions().has("media:purge")` says so,
 * but `GET /auth/me` exposes no permission list today, so `has()` currently
 * returns true for every authenticated user. The real denial signal is the
 * backend's 403, which is rendered as a muted "not permitted" state rather
 * than a scary error.
 */
export function MediaPurgeBlockedList({ onPurge }: MediaPurgeBlockedListProps) {
  const { has } = usePermissions();
  const { data, isPending, isError, error, refetch, isRefetching } =
    usePurgeBlockedMedia();

  // UX hiding only — backend `@Auth(MEDIA_PURGE)` remains authoritative.
  if (!has("media:purge")) return null;

  const forbidden =
    isError && error instanceof ApiClientError && error.status === 403;

  return (
    <section
      aria-labelledby="media-purge-blocked-heading"
      className="flex flex-col gap-3"
    >
      <div className="space-y-1">
        <h2
          id="media-purge-blocked-heading"
          className="font-semibold text-lg tracking-tight"
        >
          Purge-blocked media
        </h2>
        <p className="text-muted-foreground text-sm">
          Soft-deleted items the retention sweep could not collect because
          something still references them. Detach the references, then purge
          each item explicitly — they are never retried automatically.
        </p>
      </div>

      {isPending ? (
        // biome-ignore lint/a11y/useSemanticElements: loading requires role="status" per AGENTS.md
        <div role="status" aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">Loading purge-blocked media</span>
          {["purge-blocked-skeleton-a", "purge-blocked-skeleton-b"].map(
            (key) => (
              <Skeleton key={key} className="h-16 w-full" />
            ),
          )}
        </div>
      ) : forbidden ? (
        <p className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-muted-foreground text-sm">
          <ShieldX className="size-4" aria-hidden="true" />
          Your account cannot list purge-blocked media (the backend requires the{" "}
          <code className="mx-1">media:purge</code> permission).
        </p>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load purge-blocked media</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {error instanceof ApiClientError
                ? error.message
                : "Something went wrong. Please try again."}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : data && data.media.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-muted-foreground text-sm">
          Nothing is purge-blocked — the retention sweep is collecting normally.
        </p>
      ) : data ? (
        <ul className="flex flex-col gap-2">
          {data.media.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {/* biome-ignore lint/performance/noImgElement: backend-derived asset URL; next/image would need a remotePatterns config change outside T30 scope */}
              <img
                src={item.url}
                alt={item.altText ?? item.title ?? item.originalName}
                loading="lazy"
                className="size-10 shrink-0 rounded-md border bg-muted object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-sm">
                  {item.originalName}
                </span>
                <span className="text-muted-foreground text-xs">
                  Soft-deleted {formatDate(item.deletedAt)} · Blocked since{" "}
                  {formatDate(item.purgeBlockedAt)}
                </span>
              </div>
              <Badge
                variant="outline"
                className="hidden font-mono sm:inline-flex"
              >
                {item.mimeType}
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onPurge(item)}
              >
                <Flame aria-hidden="true" />
                Purge
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

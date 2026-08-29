"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Flame, MoreHorizontal, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/format";
import type { MediaResource } from "@/services/api/media";

export interface MediaColumnActions {
  /** Opens the routine (reversible) soft-delete confirmation. */
  onDelete: (row: MediaResource) => void;
  /** Opens the distinct irreversible purge confirmation. */
  onPurge: (row: MediaResource) => void;
  /**
   * Whether the purge action is offered. UX-only gating
   * (`usePermissions().has("media:purge")`); the backend `media:purge`
   * permission stays authoritative.
   */
  canPurge: boolean;
}

/** Human-readable byte size (backend sends `sizeBytes` as a JSON number). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"] as const;
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(value >= 100 || value < 10 ? 1 : 0)} ${units[unit]}`;
}

/**
 * Column factory for the media gallery table (T30).
 *
 * Sortable columns are restricted to fields the backend projects AND allows
 * sorting by: `createdAt`, `originalName`, `sizeBytes`, `mimeType`
 * (`MEDIA_SORTABLE_FIELDS` minus `updatedAt`, which `MediaResource` never
 * projects). The server sorts; the table is `manualSorting` inside
 * `useDataTable` and the `sort` URL param carries the state.
 */
export function getMediaColumns({
  onDelete,
  onPurge,
  canPurge,
}: MediaColumnActions): ColumnDef<MediaResource>[] {
  return [
    {
      id: "preview",
      enableSorting: false,
      header: "Preview",
      cell: ({ row }) => {
        const media = row.original;
        return (
          // The public asset route needs no headers, so a plain <img> is
          // correct (next/image would require a remotePatterns config change
          // outside T30's scope). `url` is display-only — never persisted.
          // biome-ignore lint/performance/noImgElement: backend-derived asset URL; next/image would need a remotePatterns config change outside T30 scope
          <img
            src={media.url}
            alt={media.altText ?? media.title ?? media.originalName}
            loading="lazy"
            className="size-10 rounded-md border bg-muted object-cover"
          />
        );
      },
    },
    {
      accessorKey: "originalName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="File" />
      ),
      cell: ({ row }) => {
        const media = row.original;
        const caption = media.title ?? media.altText;
        return (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{media.originalName}</span>
            {caption ? (
              <span className="truncate text-muted-foreground text-xs">
                {caption}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "mimeType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Type" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.mimeType}
        </Badge>
      ),
    },
    {
      accessorKey: "sizeBytes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Size" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatBytes(row.original.sizeBytes)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Uploaded" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <span className="sr-only">Row actions</span>,
      cell: ({ row }) => {
        const media = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Actions for ${media.originalName}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onSelect={() => onDelete(media)}
                className="[&_svg]:text-muted-foreground"
              >
                <Trash2 />
                Remove from gallery…
              </DropdownMenuItem>
              {canPurge ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => onPurge(media)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive"
                  >
                    <Flame />
                    Purge permanently…
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

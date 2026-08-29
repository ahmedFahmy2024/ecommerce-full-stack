"use client";

import { ImageIcon } from "lucide-react";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { FeatureTableShell } from "@/components/data-table/feature-table-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getMediaColumns } from "@/features/media/components/media-columns";
import { MediaToolbarControls } from "@/features/media/components/media-toolbar-controls";
import { ApiClientError } from "@/services/api/contracts";
import type { MediaResource } from "@/services/api/media";

/** Default sort mirrors the backend (`QueryMediaDto`: createdAt DESC). */
const DEFAULT_SORTING = [{ id: "createdAt", desc: true }] as const;

interface MediaTableProps {
  data: MediaResource[] | undefined;
  pageCount: number;
  isPending: boolean;
  isPlaceholderData: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  search: string;
  mimeType: string;
  onSearchChange: (value: string) => void;
  onMimeTypeChange: (value: string) => void;
  onResetFilters: () => void;
  onDelete: (row: MediaResource) => void;
  onPurge: (row: MediaResource) => void;
  canPurge: boolean;
}

/**
 * Media gallery table (T30).
 *
 * Server-controlled pagination/sort/filter: the URL is the single source of
 * truth — `FeatureTableShell` (via `useDataTable`) reads/writes
 * `page`/`limit`/`sort` with `shallow: false`, and this leaf only renders
 * what the server returned for the current URL state. Loading, error, and
 * empty are distinct states with the a11y conventions from AGENTS.md
 * (`role="status"` / `aria-busy` / `sr-only`).
 */
export function MediaTable({
  data,
  pageCount,
  isPending,
  isPlaceholderData,
  isError,
  error,
  onRetry,
  search,
  mimeType,
  onSearchChange,
  onMimeTypeChange,
  onResetFilters,
  onDelete,
  onPurge,
  canPurge,
}: MediaTableProps) {
  if (isPending) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: loading requires role="status" per AGENTS.md
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading media gallery</span>
        <DataTableSkeleton columnCount={6} rowCount={10} />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load the media gallery</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {error instanceof ApiClientError
              ? error.message
              : "Something went wrong. Please try again."}
          </span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    const isFiltered = search !== "" || mimeType !== "";
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No media found</EmptyTitle>
          <EmptyDescription>
            {isFiltered
              ? "Nothing matches the current search or media type filter."
              : "The gallery is empty — upload the first image with the upload card above."}
          </EmptyDescription>
        </EmptyHeader>
        {isFiltered ? (
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              Clear filters
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    );
  }

  const columns = getMediaColumns({ onDelete, onPurge, canPurge });

  return (
    <div aria-busy={isPlaceholderData || undefined} className="flex flex-col">
      {isPlaceholderData ? (
        <span className="sr-only">Loading media gallery</span>
      ) : null}
      <FeatureTableShell
        data={data}
        pageCount={pageCount}
        columns={columns}
        initialState={{
          sorting: DEFAULT_SORTING.map((entry) => ({ ...entry })),
          pagination: { pageIndex: 0, pageSize: 20 },
        }}
        isExtraFiltered={search !== "" || mimeType !== ""}
        onExtraReset={onResetFilters}
        toolbarExtras={() => (
          <MediaToolbarControls
            search={search}
            mimeType={mimeType}
            onSearchChange={onSearchChange}
            onMimeTypeChange={onMimeTypeChange}
          />
        )}
      />
    </div>
  );
}

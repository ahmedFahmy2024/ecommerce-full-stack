"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import * as React from "react";

import { MediaDeleteDialog } from "@/features/media/components/media-delete-dialog";
import { MediaPurgeBlockedList } from "@/features/media/components/media-purge-blocked-list";
import type { PurgeableMediaRow } from "@/features/media/components/media-purge-dialog";
import { MediaPurgeDialog } from "@/features/media/components/media-purge-dialog";
import { MediaTable } from "@/features/media/components/media-table";
import { MediaUploadCard } from "@/features/media/components/media-upload-card";
import { useMediaList } from "@/features/media/hooks/use-media-list";
import { usePermissions } from "@/hooks/use-permissions";
import { getSortingStateParser } from "@/lib/parsers";
import { buildTableQuery } from "@/lib/table-query";
import type {
  MediaListQuery,
  MediaResource,
  MediaSortField,
  PurgeBlockedMediaResource,
} from "@/services/api/media";

/**
 * Sortable table columns — the subset of `MEDIA_SORTABLE_FIELDS` the
 * `MediaResource` projection actually displays (the backend never projects
 * `updatedAt`, so it is not offered as a column even though the DTO allows
 * sorting by it). The sorting URL parser rejects any other id at parse time.
 */
const SORTABLE_COLUMN_IDS = new Set<string>([
  "createdAt",
  "originalName",
  "sizeBytes",
  "mimeType",
]);

/** Backend default (`QueryMediaDto.limit` = 20). */
const DEFAULT_PAGE_SIZE = 20;

const URL_OPTIONS = {
  shallow: false,
  clearOnDefault: true,
} as const;

/**
 * Media library screen (T30) — the client composition root.
 *
 * URL state (`page`, `limit`, `sort`, `search`, `mimeType`) is read with the
 * same nuqs keys `useDataTable` (inside `FeatureTableShell`) reads/writes, so
 * the table, the toolbar, and the API query always agree. The URL state is
 * mapped to the `GET /media` contract with `buildTableQuery`
 * (`topLevelKeys` keeps `mimeType`/`sortBy`/`sortOrder` flat — the backend
 * takes no `filters` envelope) and fed to `useMediaList`
 * (`mediaKeys.list(query)`).
 *
 * Dialog ownership lives here so the gallery table and the purge-blocked
 * list share one soft-delete flow and one irreversible purge flow.
 */
export function MediaScreen() {
  const [urlState, setUrlState] = useQueryStates({
    page: parseAsInteger.withOptions(URL_OPTIONS).withDefault(1),
    limit: parseAsInteger
      .withOptions(URL_OPTIONS)
      .withDefault(DEFAULT_PAGE_SIZE),
    sort: getSortingStateParser<MediaResource>(SORTABLE_COLUMN_IDS)
      .withOptions(URL_OPTIONS)
      .withDefault([]),
    search: parseAsString.withOptions(URL_OPTIONS).withDefault(""),
    mimeType: parseAsString.withOptions(URL_OPTIONS).withDefault(""),
  });

  const sortEntry = urlState.sort[0];
  // The parser's `validKeys` already restricts ids to SORTABLE_COLUMN_IDS at
  // parse time; this cast only narrows the static type to the DTO allow-list.
  const sortBy = sortEntry ? (sortEntry.id as MediaSortField) : undefined;
  const sortOrder = sortEntry ? (sortEntry.desc ? "DESC" : "ASC") : undefined;

  // `buildTableQuery` keeps `page`/`limit`/`search` top-level, drops empty
  // values, and — via `topLevelKeys` — leaves the media-specific params flat
  // instead of JSON-wrapping them into a `filters` envelope the backend does
  // not accept. Its return type is the generic flat query bag, which mirrors
  // `MediaListQuery` key-for-key here.
  const mediaQuery = buildTableQuery<MediaResource>(
    {
      page: urlState.page,
      limit: urlState.limit,
      search: urlState.search === "" ? null : urlState.search,
      mimeType: urlState.mimeType === "" ? null : urlState.mimeType,
      sortBy,
      sortOrder,
    },
    {
      topLevelKeys: ["mimeType", "sortBy", "sortOrder"],
    },
  ) as unknown as MediaListQuery;

  const { data, isPending, isError, error, isPlaceholderData, refetch } =
    useMediaList(mediaQuery);

  const { has } = usePermissions();
  const canPurge = has("media:purge");

  const [deleteTarget, setDeleteTarget] = React.useState<MediaResource | null>(
    null,
  );
  const [purgeTarget, setPurgeTarget] =
    React.useState<PurgeableMediaRow | null>(null);

  // Stable close handlers — the dialogs' success effects depend on these.
  const handleDeleteOpenChange = React.useCallback((open: boolean) => {
    if (!open) setDeleteTarget(null);
  }, []);
  const handlePurgeOpenChange = React.useCallback((open: boolean) => {
    if (!open) setPurgeTarget(null);
  }, []);

  const handleSearchChange = React.useCallback(
    (value: string) => {
      void setUrlState({ search: value === "" ? null : value, page: 1 });
    },
    [setUrlState],
  );

  const handleMimeTypeChange = React.useCallback(
    (value: string) => {
      void setUrlState({ mimeType: value === "" ? null : value, page: 1 });
    },
    [setUrlState],
  );

  const handleResetFilters = React.useCallback(() => {
    void setUrlState({ search: null, mimeType: null, page: 1 });
  }, [setUrlState]);

  const handleDelete = React.useCallback(
    (row: MediaResource) => setDeleteTarget(row),
    [],
  );
  const handlePurgeFromTable = React.useCallback(
    (row: MediaResource) => setPurgeTarget(row),
    [],
  );
  const handlePurgeFromBlockedList = React.useCallback(
    (row: PurgeBlockedMediaResource) => setPurgeTarget(row),
    [],
  );
  const handleRetry = React.useCallback(() => void refetch(), [refetch]);

  return (
    <div className="flex flex-col gap-6">
      <MediaUploadCard />
      <MediaTable
        data={data?.media}
        pageCount={data ? data.pagination.pages : 0}
        isPending={isPending}
        isPlaceholderData={isPlaceholderData}
        isError={isError}
        error={error ?? null}
        onRetry={handleRetry}
        search={urlState.search}
        mimeType={urlState.mimeType}
        onSearchChange={handleSearchChange}
        onMimeTypeChange={handleMimeTypeChange}
        onResetFilters={handleResetFilters}
        onDelete={handleDelete}
        onPurge={handlePurgeFromTable}
        canPurge={canPurge}
      />
      <MediaPurgeBlockedList onPurge={handlePurgeFromBlockedList} />

      <MediaDeleteDialog
        row={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={handleDeleteOpenChange}
      />
      <MediaPurgeDialog
        row={purgeTarget}
        open={purgeTarget !== null}
        onOpenChange={handlePurgeOpenChange}
      />
    </div>
  );
}

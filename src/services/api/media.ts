/**
 * Media library resource service (T30).
 *
 * Mirrors `nest-ecommerce/src/media/**` exactly (verified against source):
 *
 * - `GET /media`        — paginated gallery, **active rows only** (soft-deleted
 *   rows are absent and there is no `includeDeleted` flag; `QueryMediaDto`
 *   rejects unknown params with `forbidNonWhitelisted`).
 * - `GET /media/purge-blocked` — rows the retention sweep could not collect.
 *   NOT paginated by design; wrapper is `{ media, total }` inside the success
 *   envelope (media.controller.ts:183-186).
 * - `POST /media`       — multipart upload; the field name is `file`
 *   (`upload.options.ts:UPLOAD_FIELD_NAME`). Media type is sniffed from magic
 *   bytes server-side; a checksum dedup hit returns the EXISTING row
 *   unmodified — the caller's `altText`/`title` are silently discarded.
 * - `DELETE /media/:id` — 204 soft delete (bytes survive the retention
 *   window). NO reference check. A repeat delete on an already-deleted id is
 *   an honest 404.
 * - `DELETE /media/:id/purge` — 204, irreversible (destroys file AND row).
 *   409 when any registered consumer still references the asset; the backend
 *   filter localizes the conflict message per `x-lang`, so `error.message`
 *   from the thrown `ApiClientError` is user-displayable.
 *
 * Permissions (nest-ecommerce/src/identity/rbac.constants.ts): `media:read`,
 * `media:upload`, `media:delete`, `media:purge` (purge is admin-only via the
 * `'*'` grant). Authorization is backend-authoritative; the dashboard only
 * hides UX.
 *
 * ## `url` is display-only
 *
 * The backend derives `url` from `storageKey` + config on every response —
 * there is no `url` column. Persist/attach `id` (T32 attaches by mediaId),
 * never the derived URL.
 */

import { request } from "./client.ts";
import type { QueryParams } from "./contracts.ts";

// ---------------------------------------------------------------------------
// Types — mirrored from backend resources/DTOs (no guessing, no `any`)
// ---------------------------------------------------------------------------

/** Sortable allow-list — `QueryMediaDto.MEDIA_SORTABLE_FIELDS` (SQL-safe). */
export const MEDIA_SORTABLE_FIELDS = [
  "createdAt",
  "updatedAt",
  "originalName",
  "sizeBytes",
  "mimeType",
] as const;

export type MediaSortField = (typeof MEDIA_SORTABLE_FIELDS)[number];

export type MediaSortOrder = "ASC" | "DESC";

/**
 * Filter/paginate/sort params for `GET /media` — mirrors `QueryMediaDto`.
 * Bounds: page ≥ 1, limit 1–100 (default 20), search ≤ 255 (matches filename
 * + title), mimeType exact match ≤ 128 (e.g. `image/png`).
 *
 * A type alias (not an interface) so it carries an implicit index signature
 * and satisfies `mediaKeys.list(filters)`'s `ListFilters` parameter.
 */
export type MediaListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  mimeType?: string;
  sortBy?: MediaSortField;
  sortOrder?: MediaSortOrder;
};

/** Storage backends declared by the entity (`local` is the only Phase 3 one). */
export type MediaStorageBackend = "local" | "s3";

/**
 * Public projection of a media row (`media.resource.ts` MediaResource).
 *
 * Deliberately absent (allow-list, not blocklist): `storageKey`, `checksum`,
 * `purgeBlockedAt`, `createdBy`, `conversions`, `responsiveImages`, and
 * `updatedAt` is not projected either — sorting by it is allowed by the DTO
 * but the field never reaches the client.
 */
export interface MediaResource {
  id: string;
  /** The filename as uploaded. Display only. */
  originalName: string;
  /** The sniffed media type (magic bytes), never the declared Content-Type. */
  mimeType: string;
  /** File size in bytes (backend converts the bigint column to a number). */
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  title: string | null;
  storageBackend: MediaStorageBackend;
  /**
   * Public URL the bytes are served from — **derived, never stored**.
   * Display it; persist the `id` instead (T32 attaches by mediaId).
   */
  url: string;
  createdAt: string | Date;
}

/**
 * Maintenance item for rows the retention sweep could not collect
 * (`purge-blocked-media.resource.ts`). Unlike `MediaResource` this projects
 * `deletedAt`/`purgeBlockedAt` — for this audience those timestamps are the
 * entire reason the row is on the list.
 */
export interface PurgeBlockedMediaResource {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  title: string | null;
  url: string;
  deletedAt: string | Date;
  purgeBlockedAt: string | Date;
  createdAt: string | Date;
}

/**
 * `GET /media` data shape — the controller returns
 * `{ media, pagination: { total, page, limit, pages } }` and the global
 * `TransformInterceptor` wraps it into `ApiSuccess`.
 */
export interface MediaListResponse {
  media: MediaResource[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * `GET /media/purge-blocked` data shape — `{ media, total }` inside the
 * success envelope. Not paginated on purpose (media.controller.ts:153-158).
 */
export interface PurgeBlockedMediaResponse {
  media: PurgeBlockedMediaResource[];
  total: number;
}

/** Optional metadata accepted alongside the uploaded file (`UploadMediaDto`). */
export interface UploadMediaMeta {
  /** File-level alt text (≤255, trimmed server-side). */
  altText?: string;
  /** Human-readable gallery title (≤255, trimmed server-side). */
  title?: string;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export const MEDIA_PATHS = {
  list: "/media",
  purgeBlocked: "/media/purge-blocked",
  upload: "/media",
  byId: (id: string) => `/media/${encodeURIComponent(id)}`,
  purge: (id: string) => `/media/${encodeURIComponent(id)}/purge`,
} as const;

/** Allowed upload types — `image-type.ts ALLOWED_IMAGE_MIME_TYPES`. */
export const MEDIA_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

// ---------------------------------------------------------------------------
// Service functions — all HTTP goes through `request` (client.ts)
// ---------------------------------------------------------------------------

/**
 * Lists the gallery (active rows only). Pagination/sort/filter are
 * server-controlled; undefined values are omitted by the URL builder.
 */
export async function listMedia(
  query: MediaListQuery = {},
  options?: { signal?: AbortSignal },
): Promise<MediaListResponse | undefined> {
  const params: QueryParams = {
    page: query.page,
    limit: query.limit,
    search: query.search,
    mimeType: query.mimeType,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };

  return request<MediaListResponse>({
    path: MEDIA_PATHS.list,
    query: params,
    signal: options?.signal,
  });
}

/**
 * Lists rows the retention sweep could not collect. Requires `media:purge`
 * (admin-only); a 403 `ApiClientError` is the authoritative denied state —
 * the dashboard's permission-aware hiding is UX only.
 */
export async function getPurgeBlocked(options?: {
  signal?: AbortSignal;
}): Promise<PurgeBlockedMediaResponse | undefined> {
  return request<PurgeBlockedMediaResponse>({
    path: MEDIA_PATHS.purgeBlocked,
    signal: options?.signal,
  });
}

/**
 * Uploads one image as `multipart/form-data`.
 *
 * The file is appended under the field name `file` (`UPLOAD_FIELD_NAME`).
 * `Content-Type` is deliberately NOT set — `client.ts` strips it and the
 * browser supplies the multipart boundary. On a checksum dedup hit the
 * backend returns the existing row unmodified: the response's `title`/
 * `altText` may differ from what was sent here, and that is the honest
 * state to surface in the UI.
 */
export async function uploadMedia(
  file: File,
  meta?: UploadMediaMeta,
  options?: { signal?: AbortSignal },
): Promise<MediaResource | undefined> {
  const formData = new FormData();
  formData.append("file", file);
  if (meta?.altText !== undefined && meta.altText.trim() !== "") {
    formData.append("altText", meta.altText);
  }
  if (meta?.title !== undefined && meta.title.trim() !== "") {
    formData.append("title", meta.title);
  }

  return request<MediaResource>({
    path: MEDIA_PATHS.upload,
    method: "POST",
    body: formData,
    signal: options?.signal,
  });
}

/**
 * Soft-deletes a gallery row (204). The stored file is NOT touched and
 * existing attachments stay valid through the retention window; no reference
 * check is performed. A repeat delete returns an honest 404
 * (`ApiClientError` with status 404).
 */
export async function deleteMedia(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<undefined> {
  await request<void>({
    path: MEDIA_PATHS.byId(id),
    method: "DELETE",
    signal: options?.signal,
  });
  return undefined;
}

/**
 * Permanently purges a media item (204) — destroys the stored file AND the
 * database row. There is no undo; callers must present their own explicit
 * irreversible confirmation before invoking this.
 *
 * Throws `ApiClientError` with status 409 when any registered consumer still
 * references the item (nothing was destroyed) — render `error.message` /
 * `error.details` verbatim. Accepts ids of already soft-deleted items; that
 * is the normal soft-delete → retention → purge lifecycle.
 */
export async function purgeMedia(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<undefined> {
  await request<void>({
    path: MEDIA_PATHS.purge(id),
    method: "DELETE",
    signal: options?.signal,
  });
  return undefined;
}

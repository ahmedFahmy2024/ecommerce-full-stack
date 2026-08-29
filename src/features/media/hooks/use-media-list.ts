"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listMedia, type MediaListQuery } from "@/services/api/media";
import { mediaKeys } from "@/services/api/query-keys";

/**
 * Media gallery list hook (T30).
 *
 * Keyed on `mediaKeys.list(query)` so every server filter (page, limit,
 * search, mimeType, sortBy, sortOrder) forms a distinct cache entry and
 * `mediaKeys.lists()` invalidation after upload/delete/purge refetches the
 * active filters. `placeholderData: keepPreviousData` keeps the previous page
 * visible while the next one loads (smooth pagination); `isPlaceholderData`
 * drives the `aria-busy` state in the table leaf.
 *
 * Client-only (`enabled`): the Bearer token lives solely in browser memory
 * (`session.client.ts`), so a server-side render would always 401 — same
 * reasoning as `useAuth` (T21). Retry is delegated to the global
 * `getQueryClient` contract (never retry 4xx/ABORTED); `client.ts` already
 * handled any eligible 401 refresh before the query sees an error.
 */
export function useMediaList(query: MediaListQuery) {
  return useQuery({
    queryKey: mediaKeys.list(query),
    queryFn: ({ signal }) => listMedia(query, { signal }),
    enabled: typeof window !== "undefined",
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export type UseMediaListReturn = ReturnType<typeof useMediaList>;

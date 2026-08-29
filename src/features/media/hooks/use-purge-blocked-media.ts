"use client";

import { useQuery } from "@tanstack/react-query";
import { purgeBlockedMediaKey } from "@/features/media/media-query-keys";
import { getPurgeBlocked } from "@/services/api/media";

/**
 * Purge-blocked listing hook (T30) — `GET /media/purge-blocked`.
 *
 * Requires `media:purge` (admin-only). The 403 `ApiClientError` is the
 * authoritative denied state and is surfaced as a muted "not permitted"
 * state by the leaf; `usePermissions().has("media:purge")` only hides the
 * section (UX-level, no permission list is exposed by `GET /auth/me`).
 * Invalidated together with the gallery via `mediaKeys.all` scope.
 */
export function usePurgeBlockedMedia() {
  return useQuery({
    queryKey: purgeBlockedMediaKey,
    queryFn: ({ signal }) => getPurgeBlocked({ signal }),
    enabled: typeof window !== "undefined",
    retry: false,
    staleTime: 30 * 1000,
  });
}

export type UsePurgeBlockedMediaReturn = ReturnType<
  typeof usePurgeBlockedMedia
>;

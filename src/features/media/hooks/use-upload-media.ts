"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purgeBlockedMediaKey } from "@/features/media/media-query-keys";
import {
  type MediaResource,
  type UploadMediaMeta,
  uploadMedia,
} from "@/services/api/media";
import { mediaKeys } from "@/services/api/query-keys";

export interface UploadMediaInput {
  file: File;
  meta?: UploadMediaMeta;
}

/**
 * Upload mutation (T30) — `POST /media` as multipart with field `file`.
 *
 * On success (fresh upload OR checksum dedup hit returning the existing row)
 * the gallery list is invalidated so the new/returned row appears; the
 * purge-blocked scope is invalidated too per the T30 invalidation rule.
 * No optimistic update: the server response is the source of truth, and on a
 * dedup hit the returned row's metadata legitimately differs from what was
 * sent. Callers surface `mutation.data` (the stored row) so the dedup
 * behavior stays honest in the UI.
 */
export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation<MediaResource | undefined, Error, UploadMediaInput>({
    mutationFn: ({ file, meta }) => uploadMedia(file, meta),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: purgeBlockedMediaKey });
    },
  });
}

export type UseUploadMediaReturn = ReturnType<typeof useUploadMedia>;

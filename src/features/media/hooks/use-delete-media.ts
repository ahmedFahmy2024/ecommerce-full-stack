"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purgeBlockedMediaKey } from "@/features/media/media-query-keys";
import { deleteMedia } from "@/services/api/media";
import { mediaKeys } from "@/services/api/query-keys";

/**
 * Soft-delete mutation (T30) — `DELETE /media/:id` (204).
 *
 * No optimistic update: the row disappears only after the server confirms
 * and `mediaKeys.lists()` invalidation refetches the active-rows-only
 * gallery. A repeat delete of the same id surfaces the backend's honest 404
 * as `mutation.error` (`ApiClientError`, status 404) — callers render it
 * instead of pretending the item was still there.
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: (id) => deleteMedia(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: purgeBlockedMediaKey });
    },
  });
}

export type UseDeleteMediaReturn = ReturnType<typeof useDeleteMedia>;

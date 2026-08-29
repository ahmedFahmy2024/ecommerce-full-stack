"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purgeBlockedMediaKey } from "@/features/media/media-query-keys";
import { purgeMedia } from "@/services/api/media";
import { mediaKeys } from "@/services/api/query-keys";

/**
 * Purge mutation (T30) — `DELETE /media/:id/purge` (204, irreversible).
 *
 * Destroys the stored file AND the database row; there is no undo. Callers
 * MUST gate this behind an explicit irreversible confirmation dialog — never
 * the routine soft-delete flow. No optimistic update: invalidation refetches
 * the gallery and the purge-blocked list (a purge from that list is what
 * un-sticks the retention queue).
 *
 * A 409 `ApiClientError` means the item is still referenced and nothing was
 * destroyed — `error.message`/`error.details` are preserved by `errors.ts`
 * and must be rendered verbatim (they name what still uses the asset).
 */
export function usePurgeMedia() {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: (id) => purgeMedia(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: purgeBlockedMediaKey });
    },
  });
}

export type UsePurgeMediaReturn = ReturnType<typeof usePurgeMedia>;

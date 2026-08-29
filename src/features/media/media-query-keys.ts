import { mediaKeys } from "@/services/api/query-keys";

/**
 * Purge-blocked listing key (T30).
 *
 * `query-keys.ts` factories are frozen for T30's scope ("mediaKeys exists —
 * use it, never raw literals"), and `mediaKeys` has no purge-blocked entry
 * yet. Derive the key from the media root instead of a raw literal so that:
 * - it starts with the same `["media"]` root and is therefore invalidated by
 *   `queryClient.invalidateQueries({ queryKey: mediaKeys.all })`, and
 * - no raw `"media"` root literal leaks outside `query-keys.ts`.
 *
 * T31+ note: when a second media sub-list needs a key, add real factories to
 * `query-keys.ts` instead of deriving more keys here.
 */
export const purgeBlockedMediaKey = [
  ...mediaKeys.all,
  "purge-blocked",
] as const;

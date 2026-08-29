import type { Metadata } from "next";

import { MediaScreen } from "@/features/media";

export const metadata: Metadata = {
  title: "Media",
};

/**
 * Media library (T30) — first Milestone 3 vertical slice and the template
 * for T31+ (service → hooks → screens → states).
 *
 * This page stays **Server** (no `"use client"`): it renders the static
 * header only, and all interactivity lives in the `MediaScreen` feature
 * leaf, which reads URL state via nuqs and fetches through
 * `src/services/api/media.ts` with the browser-only Bearer token. Backend
 * `@Auth()` permissions (`media:read` / `media:upload` / `media:delete` /
 * `media:purge`) remain authoritative; permission-aware hiding in the
 * feature is UX only.
 */
export default function MediaPage() {
  return (
    <section className="flex flex-col gap-6 py-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
        <p className="text-muted-foreground text-sm">
          The shared image gallery. Uploading dedups identical files by
          checksum; removing from the gallery is reversible until the retention
          window ends, while purging destroys the file and the row permanently.
        </p>
      </div>
      <MediaScreen />
    </section>
  );
}

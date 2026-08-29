import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Media",
};

/**
 * Media route stub (T22) — Server component.
 * The vertical slice (upload/list/delete/purge) ships in T30.
 */
export default function MediaPage() {
  return (
    <RoutePlaceholder
      title="Media"
      description="Media library — upload, list, soft delete, and irreversible purge via /media."
      task="T30"
    />
  );
}

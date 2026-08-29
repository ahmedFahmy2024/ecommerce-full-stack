import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Reviews",
};

/**
 * Reviews route stub (T22) — Server component.
 * The vertical slice (moderation queue with approval toggling) ships in T52.
 */
export default function ReviewsPage() {
  return (
    <RoutePlaceholder
      title="Reviews"
      description="Review moderation queue — approve/unapprove seeded reviews via /reviews."
      task="T52"
    />
  );
}

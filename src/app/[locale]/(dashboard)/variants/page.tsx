import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Variants",
};

/**
 * Variants route stub (T22) — Server component.
 * The vertical slice (variant CRUD) ships in T33.
 */
export default function VariantsPage() {
  return (
    <RoutePlaceholder
      title="Variants"
      description="Product variant management — create, update, and delete via /variants."
      task="T33"
    />
  );
}

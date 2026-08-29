import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Inventory",
};

/**
 * Inventory route stub (T22) — Server component.
 * The vertical slice (inventory read + explicit stock adjustment) ships in T33.
 */
export default function InventoryPage() {
  return (
    <RoutePlaceholder
      title="Inventory"
      description="Stock levels per variant with explicit, confirmed adjustments via /inventory."
      task="T33"
    />
  );
}

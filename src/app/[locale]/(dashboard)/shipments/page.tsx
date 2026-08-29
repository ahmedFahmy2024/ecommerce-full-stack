import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Shipments",
};

/**
 * Shipments route stub (T22) — Server component.
 * The vertical slice (shipment workflow UI) ships in T41.
 */
export default function ShipmentsPage() {
  return (
    <RoutePlaceholder
      title="Shipments"
      description="Shipment tracking and workflow advancement via /shipments."
      task="T41"
    />
  );
}

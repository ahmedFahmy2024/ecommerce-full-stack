import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Shipping Methods",
};

/**
 * Shipping methods route stub (T22) — Server component.
 * The vertical slice (shipping-method CRUD) ships in T41.
 */
export default function ShippingMethodsPage() {
  return (
    <RoutePlaceholder
      title="Shipping Methods"
      description="Shipping method management — create, edit, and deactivate via /shipping-methods."
      task="T41"
    />
  );
}

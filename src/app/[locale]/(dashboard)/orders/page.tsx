import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Orders",
};

/**
 * Orders route stub (T22) — Server component.
 * The vertical slice (list/detail, status workflow, cancel, refund) ships in T40.
 */
export default function OrdersPage() {
  return (
    <RoutePlaceholder
      title="Orders"
      description="Order management — list/detail with status workflow, cancellation, and refunds via /orders."
      task="T40"
    />
  );
}

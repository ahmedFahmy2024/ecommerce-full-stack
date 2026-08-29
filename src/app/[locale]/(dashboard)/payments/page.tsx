import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Payments",
};

/**
 * Payments route stub (T22) — Server component.
 * The vertical slice (capture/fail actions on permitted states) ships in T41.
 */
export default function PaymentsPage() {
  return (
    <RoutePlaceholder
      title="Payments"
      description="Payment review with capture/fail actions on permitted order states via /payments."
      task="T41"
    />
  );
}

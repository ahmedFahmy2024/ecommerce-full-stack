import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Coupons",
};

/**
 * Coupons route stub (T22) — Server component.
 * The vertical slice (coupon CRUD with code-conflict handling) ships in T51.
 */
export default function CouponsPage() {
  return (
    <RoutePlaceholder
      title="Coupons"
      description="Coupon management — list, create, edit, and delete via /coupons."
      task="T51"
    />
  );
}

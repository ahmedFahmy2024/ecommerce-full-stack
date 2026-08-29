import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Products",
};

/**
 * Products route stub (T22) — Server component.
 * The vertical slice (list/detail/form + product media) ships in T32.
 */
export default function ProductsPage() {
  return (
    <RoutePlaceholder
      title="Products"
      description="Product management — list, detail, form, and product media via /products."
      task="T32"
    />
  );
}

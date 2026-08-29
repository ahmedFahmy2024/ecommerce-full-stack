import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Categories",
};

/**
 * Categories route stub (T22) — Server component.
 * The vertical slice (typed service, hooks, CRUD screens) ships in T31.
 */
export default function CategoriesPage() {
  return (
    <RoutePlaceholder
      title="Categories"
      description="Category management — list, create, edit, and delete via /categories."
      task="T31"
    />
  );
}

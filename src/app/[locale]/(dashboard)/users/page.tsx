import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Users",
};

/**
 * Users/customers route stub (T22) — Server component.
 * The vertical slice (staff-authorized user list/detail/actions) ships in T50.
 */
export default function UsersPage() {
  return (
    <RoutePlaceholder
      title="Users"
      description="Customer and staff account management via /users."
      task="T50"
    />
  );
}

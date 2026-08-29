import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Profile",
};

/**
 * Profile route stub (T22) — Server component.
 * The current-operator profile screen ships with the account work in T50.
 */
export default function ProfilePage() {
  return (
    <RoutePlaceholder
      title="Profile"
      description="Current operator profile — identity from GET /auth/me."
      task="T50"
    />
  );
}

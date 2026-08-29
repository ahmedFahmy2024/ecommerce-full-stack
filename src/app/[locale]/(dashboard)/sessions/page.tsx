import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = {
  title: "Sessions",
};

/**
 * Sessions route stub (T22) — Server component.
 * The vertical slice (session list/revocation; revoking the current session
 * logs out) ships in T50.
 */
export default function SessionsPage() {
  return (
    <RoutePlaceholder
      title="Sessions"
      description="Current operator sessions — list and revoke via /auth/sessions."
      task="T50"
    />
  );
}

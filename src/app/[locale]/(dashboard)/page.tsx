export const dynamic = "force-dynamic";

/**
 * Protected dashboard home (T21).
 *
 * This page is **Server** (no `"use client"`). It renders only after the
 * parent `AuthBoundary` (client leaf) has verified `GET /auth/me` via
 * `authKeys.me()`. Anonymous users never reach this JSX — they are
 * client-redirected to `/login` by the boundary (proxy stays locale-only).
 *
 * The data shown here is intentionally minimal; Overview metrics (T60)
 * require a dedicated backend aggregate endpoint — do not aggregate
 * paginated entities client-side (see DASHBOARD_NEST_ECOMMERCE_INTEGRATION_PLAN.md Phase 3).
 */
export default function DashboardHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Ecommerce Admin</h1>
      <p className="text-sm text-muted-foreground">
        Welcome — you are authenticated. This shell is protected by
        <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
          AuthBoundary
        </code>
        loading
        <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
          GET /auth/me
        </code>
        as authoritative identity.
      </p>
      <div className="rounded-lg border p-4 text-sm">
        <p className="font-medium">Navigation</p>
        <p className="text-muted-foreground">
          Overview / Catalog / Sales / Customers / Marketing / Account —
          rendered by the sidebar from the e-commerce nav config with
          permission-aware hiding (backend <code>@Auth()</code> stays
          authoritative). Catalog, Sales, Customers, Marketing, and Account
          routes are placeholders until their vertical slices (T30+) land.
        </p>
      </div>
    </div>
  );
}

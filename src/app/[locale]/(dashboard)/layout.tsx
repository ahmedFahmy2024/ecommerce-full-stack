import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NavBreadcrumb } from "@/components/layout/nav-breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * Protected dashboard shell (T21/T22).
 *
 * This layout stays **Server** (no `"use client"`). Auth is enforced by the
 * client leaf `AuthBoundary` which loads `GET /auth/me` via `authKeys.me()`
 * as authoritative identity. Anonymous users are client-redirected to
 * `/login`; the proxy (`src/proxy.ts`) remains locale-only and never
 * gates auth (per T15/T16). Distinct states:
 * - loading: skeleton with `role="status"` (AuthBoundary + `loading.tsx`)
 * - denied: 403 via `denied/page.tsx` or AuthBoundary 403 branch
 * - session-expired/unauthenticated: 401 → `clearSessionAndNotify` + redirect
 *   with `UnauthenticatedResult` (AuthBoundary)
 * - not-found: `not-found.tsx` via `Link from "@/i18n/navigation"`
 *
 * T22: the header breadcrumb is a client leaf (`NavBreadcrumb`) that derives
 * its labels from the e-commerce navigation config and links through
 * `Link from "@/i18n/navigation"`; the sidebar renders the same config with
 * permission-aware hiding.
 */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthBoundary>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ms-1" />
            <Separator orientation="vertical" className="me-2 h-4" />
            <NavBreadcrumb />
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthBoundary>
  );
}

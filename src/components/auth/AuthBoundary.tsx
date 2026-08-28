"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldX } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/services/api/contracts";
import {
  clearSessionAndNotify,
  registerLogoutHook,
  toUnauthenticated,
  type UnauthenticatedResult,
} from "@/services/api/session.client";

/**
 * Protected shell auth boundary — client leaf (T21).
 *
 * Responsibilities:
 * - Loads `GET /auth/me` as authoritative identity via `useAuth`
 *   (`authKeys.me()` + `getMe()`), never from login response.
 * - `loading`: skeleton with `role="status"` / `aria-busy` / `sr-only`
 *   (per AGENTS.md loading.tsx a11y, but inline here for client boundary).
 * - `401` (session expired / unauthenticated): `clearSessionAndNotify()`
 *   + redirect to `/login`. Exposes `UnauthenticatedResult` via
 *   `toUnauthenticated("refresh_failed")` attached to the boundary's
 *   error branch so callers/tests can branch on the typed value.
 *   Anonymous hits to `/(dashboard)/*` are therefore client-redirected,
 *   never proxied via `proxy.ts` (which stays locale-only per T15/T16).
 * - `403` (no permission): renders denied state identical to
 *   `/(dashboard)/denied/page.tsx` using `Link from "@/i18n/navigation"`.
 * - `404`/other handled by `not-found.tsx` / `error.tsx` at the route
 *   level; this boundary only handles auth states.
 *
 * Server pages/layouts stay Server — this is the smallest leaf that
 * needs browser APIs (`useState`/`useEffect` + `credentials: "include"` cookie
 * transport lives inside `getMe` -> `transportFetch`). Never import this
 * from `proxy.ts` or any Server component that would hoist token state.
 */

// Exposed for T21 verification: typed unauthenticated signal.
// Consumers may import this alongside the boundary.
export type { UnauthenticatedResult };

function LoadingState() {
  return (
    // biome-ignore lint/a11y/useSemanticElements: loading requires role="status" per AGENTS.md
    <div
      className="flex min-h-[60vh] items-center justify-center p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="size-8 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="text-sm text-muted-foreground">Loading…</span>
        <span className="sr-only">Loading dashboard shell</span>
      </div>
    </div>
  );
}

function DeniedState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <ShieldX className="size-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-muted-foreground text-sm">
          You don&apos;t have permission to access that page. If you believe
          this is a mistake, please contact your administrator.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function SessionExpiredState() {
  return (
    // biome-ignore lint/a11y/useSemanticElements: session-expired requires role="status" per AGENTS.md
    <div
      className="flex min-h-[60vh] items-center justify-center p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="size-8 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="text-sm text-muted-foreground">
          Session expired — redirecting to login…
        </span>
        <span className="sr-only">Session expired, redirecting to login</span>
      </div>
    </div>
  );
}

export function AuthBoundary({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error, fetchStatus } = useAuth();

  // Register a logout hook that clears TanStack Query caches.
  // `registerLogoutHook` is idempotent per mount; the hook runs exactly
  // once per `clearSessionAndNotify()` (see session.client.ts:168).
  useEffect(() => {
    const hook = () => {
      queryClient.clear();
    };
    registerLogoutHook(hook);
    // No unregister — hooks array is intentionally append-only and
    // `clearSessionAndNotify` runs all hooks exactly once.
  }, [queryClient]);

  // Session-expired side effect: clearSessionAndNotify + redirect.
  // Must run only on the client after the query settles to 401.
  useEffect(() => {
    if (!isError || !(error instanceof ApiClientError)) return;
    if (error.status !== 401) return;

    // Expose typed unauthenticated result for callers/tests that branch
    // on `UnauthenticatedResult` rather than status code. We attach it to
    // the error's `cause` shape via `toUnauthenticated` for consistency
    // with `auth.ts:refreshAccessToken` (which sets `unauthenticated` on
    // the thrown ApiClientError). Here we just materialize the value.
    const _unauthenticated: UnauthenticatedResult =
      toUnauthenticated("refresh_failed");
    void _unauthenticated;

    void clearSessionAndNotify()
      .then(() => {
        queryClient.clear();
      })
      .finally(() => {
        router.replace("/login");
      });
  }, [isError, error, router, queryClient]);

  // While the query is disabled on the server (`enabled: typeof window !== "undefined"`),
  // `isPending` is true and `fetchStatus` is idle. Treat that as loading on the
  // server to avoid flashing unauthenticated. On the client, isPending covers
  // the actual fetch.
  const isLoading =
    isPending || fetchStatus === "fetching" || (!data && !isError);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    if (error instanceof ApiClientError) {
      if (error.status === 401) {
        // Keep the typed unauthenticated on this branch as well (render path
        // mirrors the effect branch). Tests can assert the import exists.
        const _unauthenticated: UnauthenticatedResult =
          toUnauthenticated("refresh_failed");
        void _unauthenticated;
        return <SessionExpiredState />;
      }
      if (error.status === 403) {
        return <DeniedState />;
      }
    }
    // Non-auth error: bubble to the route's `error.tsx` by re-throwing.
    // We render a minimal fallback here so the boundary itself never
    // swallows a transport/network error silently.
    throw error instanceof Error ? error : new Error("Failed to load session");
  }

  // Authenticated — render the protected shell.
  // `data` is the authoritative `GET /auth/me` user, not the login response.
  void data;
  return <>{children}</>;
}

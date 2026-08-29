"use client";

import { useAuth } from "@/hooks/use-auth";

/**
 * Permission-aware helper (T22).
 *
 * Derives visibility from `useAuth()` (`GET /auth/me` via `authKeys.me()`),
 * which is the authoritative identity — not from a guessed
 * `GET /users/:id/permissions` or `GET /auth/permissions` endpoint
 * (those routes do not exist; `GET /auth/me` returns `UserResource`
 * without a permission list, so hiding is UX only and backend
 * `@Auth()` remains authoritative).
 *
 * Contract:
 * - `has(permission?)` → true if no permission required, or user is
 *   authenticated and (when backend exposes a permission array) that array
 *   contains the required permission (including `*` wildcard for admin).
 *   When no permission array is present on `AuthUser`, any authenticated
 *   user is treated as visible — this avoids false hiding while keeping
 *   the hook structurally permission-aware for future backend exposure.
 * - `hasAny` / `hasAll` for grouped checks.
 * - Never calls `fetch`, never reads `NEXT_PUBLIC_*`, never touches proxy.ts.
 */

type AuthUserWithPerms = {
  permissions?: string[];
  roles?: string[];
  // Allow future backend to embed either `permissions` or `permissionNames`
  permissionNames?: string[];
};

function extractPermissions(user: unknown): string[] | undefined {
  if (!user || typeof user !== "object") return undefined;
  const u = user as Record<string, unknown>;
  // Support both `permissions` and `permissionNames` keys; accept string[] only
  const candidates = [
    u.permissions,
    u.permissionNames,
    (u as { perms?: unknown }).perms,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.every((v) => typeof v === "string")) {
      return c as string[];
    }
  }
  // Also support `roles` with wildcard — but we treat roles as not granting
  // nav visibility unless they expand to permissions; keep here for future.
  return undefined;
}

export function usePermissions() {
  const { data, isPending, isError, error } = useAuth();

  const user = data as unknown as AuthUserWithPerms | undefined;
  const permissions = user ? extractPermissions(user) : undefined;
  const permissionSet = permissions
    ? new Set(permissions)
    : undefined;

  const isLoading = isPending;
  const isAuthenticated = !!data && !isError;

  function has(permission?: string): boolean {
    if (!permission) return true;
    if (!isAuthenticated) return false;
    // No permission list exposed → show to any authenticated user (UX hiding only)
    if (!permissionSet) return true;
    if (permissionSet.has("*")) return true;
    return permissionSet.has(permission);
  }

  function hasAny(perms: string[]): boolean {
    if (perms.length === 0) return true;
    return perms.some((p) => has(p));
  }

  function hasAll(perms: string[]): boolean {
    if (perms.length === 0) return true;
    return perms.every((p) => has(p));
  }

  return {
    user: data,
    isLoading,
    isAuthenticated,
    isError,
    error,
    permissions: permissionSet,
    has,
    hasAny,
    hasAll,
  };
}

/**
 * Pure helper for non-hook contexts (e.g. tests or server utilities that
 * already have a user object). Mirrors `has` logic without calling `useAuth`.
 */
export function canViewWithPermissions(
  user: unknown,
  requiredPermission?: string,
): boolean {
  if (!requiredPermission) return true;
  if (!user) return false;
  const perms = extractPermissions(user);
  if (!perms) return true;
  if (perms.includes("*")) return true;
  return perms.includes(requiredPermission);
}

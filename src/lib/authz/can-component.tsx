"use client";

import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

import { evaluate, type PermissionCheck } from "./can";
import { useMyPermissions } from "./client";

interface CanProps extends PermissionCheck {
  children: ReactNode;
  /** Rendered while the permissions query is loading (default: null). */
  loadingFallback?: ReactNode;
  /** Rendered when the user fails the check (default: null — hidden). */
  fallback?: ReactNode;
}

/**
 * Client-side declarative permission gate. Hides children when the user
 * lacks the required permission. Use one of `permission`, `anyOf`, `allOf`.
 *
 * <Can permission="CREATE_ROLE">…</Can>
 * <Can anyOf={["CREATE_ROLE", "UPDATE_ROLE"]}>…</Can>
 * <Can allOf={["VIEW_ROLE", "LIST_ROLE"]}>…</Can>
 */
export function Can({
  children,
  loadingFallback = null,
  fallback = null,
  ...check
}: CanProps) {
  const { data: session } = useSession();
  const { permissions, isFetched } = useMyPermissions(session?.user?.id);

  if (!isFetched) return <>{loadingFallback}</>;
  if (!evaluate(permissions, check)) return <>{fallback}</>;
  return <>{children}</>;
}

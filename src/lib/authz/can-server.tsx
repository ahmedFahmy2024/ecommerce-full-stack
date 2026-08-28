import type { ReactNode } from "react";

import { evaluate, type PermissionCheck } from "./can";
import { getMyPermissions } from "./server";

interface CanServerProps extends PermissionCheck {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Server-side declarative permission gate. Use inside server components.
 *
 * <CanServer permission="CREATE_ROLE">…</CanServer>
 */
export async function CanServer({
  children,
  fallback = null,
  ...check
}: CanServerProps) {
  const permissions = await getMyPermissions();
  if (!evaluate(permissions, check)) return <>{fallback}</>;
  return <>{children}</>;
}

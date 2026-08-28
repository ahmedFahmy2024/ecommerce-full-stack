import "server-only";

import { cache } from "react";

import { auth } from "@/auth";
import apiClient from "@/services/api";
import { USERS_PERMISSIONS } from "@/services/api/queries";
import { canAll, canAny, evaluate, type PermissionCheck } from "./can";
import type { Permission } from "./permissions";

interface MyPermissionsResponse {
  permissions: string[];
}

/**
 * Per-request memoized: every component in a single render that calls
 * getMyPermissions() shares one fetch.
 */
export const getMyPermissions = cache(async (): Promise<Set<string>> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Set();

  try {
    const res = await apiClient<MyPermissionsResponse>(USERS_PERMISSIONS, {
      params: { id: userId },
    });
    return new Set(res.data?.permissions ?? []);
  } catch {
    return new Set();
  }
});

export async function canServer(required: Permission): Promise<boolean> {
  const perms = await getMyPermissions();
  return perms.has(required);
}

export async function canAnyServer(required: Permission[]): Promise<boolean> {
  const perms = await getMyPermissions();
  return canAny(perms, required);
}

export async function canAllServer(required: Permission[]): Promise<boolean> {
  const perms = await getMyPermissions();
  return canAll(perms, required);
}

export async function evaluateServer(check: PermissionCheck): Promise<boolean> {
  const perms = await getMyPermissions();
  return evaluate(perms, check);
}

"use client";

import { useQuery } from "@tanstack/react-query";

import apiClient from "@/services/api";
import { USERS_PERMISSIONS } from "@/services/api/queries";
import { canAll, canAny, evaluate, type PermissionCheck } from "./can";
import type { Permission } from "./permissions";
import { MY_PERMISSIONS_QUERY_KEY } from "./queries";

interface MyPermissionsResponse {
  permissions: string[];
}

async function fetchMyPermissions(userId: string): Promise<string[]> {
  const res = await apiClient<MyPermissionsResponse>(USERS_PERMISSIONS, {
    params: { id: userId },
  });
  return res.data?.permissions ?? [];
}

export interface UseMyPermissionsResult {
  permissions: Set<string>;
  isLoading: boolean;
  isFetched: boolean;
}

export function useMyPermissions(
  userId: string | undefined,
): UseMyPermissionsResult {
  const { data, isLoading, isFetched } = useQuery({
    queryKey: MY_PERMISSIONS_QUERY_KEY,
    queryFn: () => fetchMyPermissions(userId as string),
    enabled: !!userId,
    staleTime: Infinity,
  });

  return {
    permissions: new Set(data ?? []),
    isLoading,
    isFetched,
  };
}

export function useCan(
  userId: string | undefined,
  required: Permission,
): boolean {
  const { permissions } = useMyPermissions(userId);
  return permissions.has(required);
}

export function useCanAny(
  userId: string | undefined,
  required: Permission[],
): boolean {
  const { permissions } = useMyPermissions(userId);
  return canAny(permissions, required);
}

export function useCanAll(
  userId: string | undefined,
  required: Permission[],
): boolean {
  const { permissions } = useMyPermissions(userId);
  return canAll(permissions, required);
}

export function useEvaluate(
  userId: string | undefined,
  check: PermissionCheck,
): boolean {
  const { permissions } = useMyPermissions(userId);
  return evaluate(permissions, check);
}

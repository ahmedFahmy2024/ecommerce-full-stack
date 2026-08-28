"use client";

import { useQuery } from "@tanstack/react-query";
import type { Material } from "@/features/materials/types";
import { request } from "@/services/api";
import type { Option } from "@/types/data-table";
import type { PaginatedResponse } from "@/types/pagination";

export function useMaterialsOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["materials", "options"],
    queryFn: async () => {
      const res = await request<PaginatedResponse<Material>>({
        path: "/materials",
        query: { limit: 200 },
      });
      const data = res as unknown as PaginatedResponse<Material> | undefined;
      return (data?.items ?? []).map<Option>((m: Material) => ({
        label: (m as unknown as { name: string }).name,
        value: (m as unknown as { id: string }).id,
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

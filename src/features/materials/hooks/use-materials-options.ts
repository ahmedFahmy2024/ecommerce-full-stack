"use client";

import { useQuery } from "@tanstack/react-query";
import type { Material } from "@/features/materials/types";
import apiClient from "@/services/api";
import { MATERIALS } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";
import type { Option } from "@/types/data-table";

export function useMaterialsOptions(enabled: boolean) {
  return useQuery({
    queryKey: [MATERIALS, "options"],
    queryFn: async () => {
      const res = await apiClient<PaginatedResponse<Material>>(MATERIALS, {
        query: { limit: 200 },
      });
      return res.data.items.map<Option>((m) => ({
        label: m.name,
        value: m.id,
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

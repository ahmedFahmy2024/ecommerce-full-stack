"use client";

import { useEntityOptions } from "@/hooks/use-entity-options";
import apiClient from "@/services/api";
import { CLASSES_MATERIALS } from "@/services/api/queries";

interface ClassMaterialItem {
  id: string;
  title: { ar: string; en: string };
}

export function useClassMaterialsOptions(classId: string, enabled: boolean) {
  return useEntityOptions<ClassMaterialItem>({
    queryKey: [CLASSES_MATERIALS, classId, "options"],
    fetcher: async () => {
      const res = await apiClient<ClassMaterialItem[]>(CLASSES_MATERIALS, {
        params: { id: classId },
      });
      return res.data;
    },
    toOption: (m) => ({
      label: m.title.en || m.title.ar,
      value: m.id,
    }),
    enabled: enabled && !!classId,
  });
}

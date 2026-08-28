"use client";

import { useEntityOptions } from "@/hooks/use-entity-options";
import { request } from "@/services/api";

interface ClassMaterialItem {
  id: string;
  title: { ar: string; en: string };
}

export function useClassMaterialsOptions(classId: string, enabled: boolean) {
  return useEntityOptions<ClassMaterialItem>({
    queryKey: ["classes", classId, "materials", "options"],
    fetcher: async () => {
      const res = await request<ClassMaterialItem[]>({
        path: "/classes/{id}/materials",
        params: { id: classId },
      });
      return (
        (res as unknown as { data?: ClassMaterialItem[] })?.data ??
        (res as unknown as ClassMaterialItem[]) ??
        []
      );
    },
    toOption: (m) => ({
      label: m.title.en || m.title.ar,
      value: m.id,
    }),
    enabled: enabled && !!classId,
  });
}

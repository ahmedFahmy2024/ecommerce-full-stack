"use client";

import { type QueryKey, useQuery } from "@tanstack/react-query";

import type { Option } from "@/types/data-table";

interface UseEntityOptionsArgs<T> {
  queryKey: QueryKey;
  fetcher: () => Promise<T[]>;
  toOption: (item: T) => Option;
  enabled: boolean;
  staleTime?: number;
}

const FIVE_MINUTES = 5 * 60 * 1000;

export function useEntityOptions<T>({
  queryKey,
  fetcher,
  toOption,
  enabled,
  staleTime = FIVE_MINUTES,
}: UseEntityOptionsArgs<T>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const items = await fetcher();
      return items.map(toOption);
    },
    enabled,
    staleTime,
  });
}

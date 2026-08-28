import apiClient from "@/services/api";
import type { PaginatedResponse } from "@/types/api";

export interface ComboboxFetcherEntity {
  id: string;
  name?: string | { ar?: string; en?: string };
  title?: string;
  fullName?: string;
  displayName?: string;
}

export interface ComboboxFetcherParams {
  page: number;
  limit: number;
  search?: string;
}

export interface ComboboxFetcherPage<T> {
  items: T[];
  hasNextPage: boolean;
}

/**
 * Builds a paginated infinite-combobox fetcher for an endpoint name.
 * The endpoint must return PaginatedResponse<T>.
 */
export function makeComboboxFetcher<T = ComboboxFetcherEntity>(
  endpointName: string,
) {
  return async ({
    page,
    limit,
    search,
  }: ComboboxFetcherParams): Promise<ComboboxFetcherPage<T>> => {
    const res = await apiClient<PaginatedResponse<T>>(endpointName, {
      query: { page, limit, ...(search ? { search } : {}) },
    });
    return { items: res.data.items, hasNextPage: res.data.meta.hasNextPage };
  };
}

/**
 * Picks the best display label for a backend entity, falling back across the
 * common naming fields used in this codebase (displayName, fullName, title,
 * localized name objects, plain name).
 */
export function getEntityLabel(entity: ComboboxFetcherEntity): string {
  if (entity.displayName) return entity.displayName;
  if (entity.fullName) return entity.fullName;
  if (entity.title) return entity.title;
  if (typeof entity.name === "string") return entity.name;
  if (entity.name && typeof entity.name === "object") {
    return entity.name.en ?? entity.name.ar ?? entity.id;
  }
  return entity.id;
}

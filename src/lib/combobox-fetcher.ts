import { request } from "@/services/api";
import type { PaginatedResponse } from "@/types/pagination";

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
 * Builds a paginated infinite-combobox fetcher for a resource path.
 * Legacy helper — old pages still call it with endpoint name strings like
 * `USERS`, `MATERIALS`, etc. (from `services/api/queries.ts`). New code
 * should call `request` directly with explicit `path` and typed pagination
 * from `services/api/contracts.ts` (`PaginatedData<T>`).
 *
 * @param path - Resource path below `/v1` (e.g. `/users`, `/materials`) or
 *   legacy endpoint name chunk. A leading slash is added if missing.
 * @deprecated — legacy UI only, uses old `PaginatedResponse` shape.
 */
export function makeComboboxFetcher<T = ComboboxFetcherEntity>(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return async ({
    page,
    limit,
    search,
  }: ComboboxFetcherParams): Promise<ComboboxFetcherPage<T>> => {
    const res = await request<PaginatedResponse<T>>({
      path: normalizedPath,
      query: { page, limit, ...(search ? { search } : {}) },
    });
    // `request` unwraps `ApiSuccess.data` and returns `PaginatedResponse` directly
    // (or `undefined` for 204/empty). Legacy pages expect `res.data.items`,
    // but new transport returns `res.items` — handle both.
    const data =
      (res as unknown as { data?: PaginatedResponse<T> })?.data ?? res;
    if (!data) return { items: [], hasNextPage: false };
    return {
      items: data.items ?? [],
      hasNextPage: data.meta?.hasNextPage ?? false,
    };
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

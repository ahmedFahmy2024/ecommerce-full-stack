/**
 * Legacy pagination UI helper — NOT the Nest API contract.
 *
 * Old template pages (categories, batches, classes, materials, users, roles,
 * etc.) and `lib/combobox-fetcher` still expect a table shape
 * `{ items: T[], meta: PaginationMeta, links: PaginationLinks, facets? }`.
 * The current Nest backend returns `{ <collection>: T[], pagination: { total,
 * page, limit, pages } }` inside `ApiSuccess.data` (see
 * `services/api/contracts.ts` `PaginationMeta` / `PaginatedData`).
 *
 * This file preserves the old UI shape solely so those legacy pages continue
 * to type-check until they are deleted in T70. New code must use
 * `services/api/contracts.ts` (`PaginationMeta` `{ total, page, limit, pages }`
 * and `PaginatedData<T>`) and must NOT import from here. Do not extend this
 * helper to new features.
 *
 * Relocated from `types/api.ts` in T16 to make the old-backend implication
 * explicit and to allow `types/api.ts` to be deleted. Any import from
 * `@/types/api` for `PaginatedResponse` should be updated to `@/types/pagination`.
 *
 * @deprecated — legacy UI only, will be removed with old pages in T70.
 */
export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationLinks {
  first: string;
  previous: string;
  next: string;
  last: string;
  current: string;
}

export interface Facets {
  languages: { value: string; count: number }[];
  tiers: { value: string; count: number }[];
  priceRange: { min: number; max: number };
  ratings: { value: number; count: number }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
  facets?: Facets;
  maxSalePrice?: number;
}

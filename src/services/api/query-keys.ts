/**
 * Stable TanStack Query key factories (T20).
 *
 * Every server filter must appear in the key so that TanStack Query can
 * correctly separate, cache, and invalidate list queries that differ only by
 * filter values. No component may construct a query key from a raw string
 * literal — import and use these factories instead.
 *
 * Conventions:
 * - Each domain owns a single root key (e.g. `['products']`).
 * - `all` is the root.
 * - `lists` / `details` are scope keys.
 * - `list(filters)` includes **all** server filters (pagination, search,
 *   sort, status, etc.) as the final element so different filters → distinct
 *   cache entries.
 * - `detail(id)` and `bySlug(slug)` are single-entity scopes.
 * - Sub-resources that belong to a parent (product media, variant inventory)
 *   include the parent identifier in the key.
 *
 * Rules from TASK.md T20 / DASHBOARD_NEST_ECOMMERCE_INTEGRATION_PLAN.md:
 * - Use only helpers from `@/services/api` for data fetching; keys here are
 *   the only allowed source for `queryKey`.
 * - All server filters in both request `query` and `queryKey`.
 * - No `NEXT_PUBLIC_*` reads, no `fetch`, no UI imports here.
 */

// ---------------------------------------------------------------------------
// Shared filter type — keeps list factories flexible while staying typed
// ---------------------------------------------------------------------------

export type ListFilters = Readonly<Record<string, unknown>>;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
  session: (id: string) => [...authKeys.sessions(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoriesKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...categoriesKeys.lists(), filters ?? {}] as const,
  details: () => [...categoriesKeys.all, "detail"] as const,
  detail: (id: string) => [...categoriesKeys.details(), id] as const,
  bySlug: (slug: string) => [...categoriesKeys.all, "slug", slug] as const,
} as const;

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const productsKeys = {
  all: ["products"] as const,
  lists: () => [...productsKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...productsKeys.lists(), filters ?? {}] as const,
  details: () => [...productsKeys.all, "detail"] as const,
  detail: (id: string) => [...productsKeys.details(), id] as const,
  bySlug: (slug: string) => [...productsKeys.all, "slug", slug] as const,
} as const;

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const variantsKeys = {
  all: ["variants"] as const,
  lists: () => [...variantsKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...variantsKeys.lists(), filters ?? {}] as const,
  details: () => [...variantsKeys.all, "detail"] as const,
  detail: (id: string) => [...variantsKeys.details(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Inventory — per-variant stock
// ---------------------------------------------------------------------------

export const inventoryKeys = {
  all: ["inventory"] as const,
  details: () => [...inventoryKeys.all, "detail"] as const,
  detail: (variantId: string) =>
    [...inventoryKeys.details(), variantId] as const,
} as const;

// ---------------------------------------------------------------------------
// Product media — media attached to a product
// ---------------------------------------------------------------------------

export const productMediaKeys = {
  all: ["product-media"] as const,
  lists: () => [...productMediaKeys.all, "list"] as const,
  list: (productId: string, filters?: ListFilters) =>
    [...productMediaKeys.lists(), productId, filters ?? {}] as const,
  detail: (productId: string) =>
    [...productMediaKeys.all, "detail", productId] as const,
} as const;

// ---------------------------------------------------------------------------
// Media library
// ---------------------------------------------------------------------------

export const mediaKeys = {
  all: ["media"] as const,
  lists: () => [...mediaKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...mediaKeys.lists(), filters ?? {}] as const,
  details: () => [...mediaKeys.all, "detail"] as const,
  detail: (id: string) => [...mediaKeys.details(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ordersKeys = {
  all: ["orders"] as const,
  lists: () => [...ordersKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...ordersKeys.lists(), filters ?? {}] as const,
  details: () => [...ordersKeys.all, "detail"] as const,
  detail: (id: string) => [...ordersKeys.details(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Shipping methods
// ---------------------------------------------------------------------------

export const shippingMethodsKeys = {
  all: ["shipping-methods"] as const,
  lists: () => [...shippingMethodsKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...shippingMethodsKeys.lists(), filters ?? {}] as const,
  details: () => [...shippingMethodsKeys.all, "detail"] as const,
  detail: (id: string) => [...shippingMethodsKeys.details(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Shipments
// ---------------------------------------------------------------------------

export const shipmentsKeys = {
  all: ["shipments"] as const,
  lists: () => [...shipmentsKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...shipmentsKeys.lists(), filters ?? {}] as const,
  details: () => [...shipmentsKeys.all, "detail"] as const,
  detail: (id: string) => [...shipmentsKeys.details(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Users / customers
// ---------------------------------------------------------------------------

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...usersKeys.lists(), filters ?? {}] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Coupons / promotions
// ---------------------------------------------------------------------------

export const couponsKeys = {
  all: ["coupons"] as const,
  lists: () => [...couponsKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...couponsKeys.lists(), filters ?? {}] as const,
  details: () => [...couponsKeys.all, "detail"] as const,
  detail: (id: string) => [...couponsKeys.details(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewsKeys = {
  all: ["reviews"] as const,
  lists: () => [...reviewsKeys.all, "list"] as const,
  list: (filters?: ListFilters) =>
    [...reviewsKeys.lists(), filters ?? {}] as const,
  details: () => [...reviewsKeys.all, "detail"] as const,
  detail: (id: string) => [...reviewsKeys.details(), id] as const,
} as const;

// ---------------------------------------------------------------------------
// Re-export map — useful for tooling / exhaustive checks
// ---------------------------------------------------------------------------

export const queryKeys = {
  auth: authKeys,
  categories: categoriesKeys,
  products: productsKeys,
  variants: variantsKeys,
  inventory: inventoryKeys,
  productMedia: productMediaKeys,
  media: mediaKeys,
  orders: ordersKeys,
  shippingMethods: shippingMethodsKeys,
  shipments: shipmentsKeys,
  users: usersKeys,
  coupons: couponsKeys,
  reviews: reviewsKeys,
} as const;

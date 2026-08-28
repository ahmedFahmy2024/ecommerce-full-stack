/**
 * Transport contracts for the Nest e-commerce backend.
 *
 * All dashboard HTTP traffic targets `nest-ecommerce` under `/v1` (URI
 * versioning). The backend's global `TransformInterceptor` and
 * `HttpExceptionFilter` define the only envelope shapes a client may observe;
 * this file is the sole source of truth for those shapes.
 *
 * ## Non-goals
 * Domain models (Product, Category, Order, etc.) belong in their resource
 * modules (e.g. `catalog.ts`, `orders.ts`), not here.
 */

// ---------------------------------------------------------------------------
// Envelopes — produced by TransformInterceptor / HttpExceptionFilter
// ---------------------------------------------------------------------------

/**
 * `meta` attached to every JSON response, success or failure.
 *
 * Produced from `request.url` at response time. Contains no pagination
 * info — that lives inside `data` for paginated endpoints.
 */
export interface ApiResponseMeta {
  timestamp: string;
  path: string;
  [key: string]: unknown;
}

/**
 * Successful 2xx JSON response.
 *
 * Wrapping is applied by `TransformInterceptor` unless the handler opts out
 * with `@SkipTransform()` (health check, raw asset bytes). Paginated
 * endpoints do **not** opt out — their pagination object is nested inside
 * `data`, not in this top-level `meta`.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

/**
 * Machine-readable error body inside {@link ApiFailure}.
 *
 * - `message` is `string | string[]` — validation pipes emit an array of
 *   i18n keys, domain errors emit a single key.
 * - `details` is present only when the thrower supplied structured data
 *   (e.g. checkout `PRICE_CHANGED` lines or validation details). It is
 *   author-intended for the client and must be preserved verbatim.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  code: string;
  details?: unknown;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
  meta: ApiResponseMeta;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

// ---------------------------------------------------------------------------
// Pagination — as actually returned by controllers/resources
// ---------------------------------------------------------------------------

/**
 * Pagination block as returned **inside** `ApiSuccess.data`.
 *
 * Verified against live controllers (`nest-ecommerce/src/catalog/*.controller.ts`,
 * `src/identity/users.controller.ts`, `src/media/media.controller.ts`,
 * `src/orders/orders.controller.ts`, `src/promotions/promotions.controller.ts`,
 * `src/engagement/reviews.controller.ts`,
 * `src/fulfillment/shipping-methods.controller.ts`):
 *
 * ```ts
 * // controller implementation — e.g. ProductsController.findAll
 * return {
 *   products: ProductResource.fromCollection(items, urlConfig),
 *   pagination: { total, page, limit, pages: Math.ceil(total / limit) },
 * };
 * // then TransformInterceptor wraps it:
 * // { success: true, data: { products, pagination }, meta: { timestamp, path } }
 * ```
 *
 * Field names are `pages` (not `totalPages`), `total` (not `totalItems`),
 * and there are no legacy `items`, `links`, `facets`, `hasNextPage`, etc.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Shape of `ApiSuccess.data` for a paginated listing.
 *
 * The collection key is resource-specific (`products`, `categories`, `users`,
 * `media`, `orders`, `coupons`, `reviews`, `variants`, `shippingMethods`,
 * …) so the generic keeps it open via index signature while requiring
 * `pagination` to be present.
 *
 * Use the `CollectionKey` param when a call site knows the exact key:
 * `PaginatedData<Product, "products">` narrows to `{ products: Product[]; pagination }`.
 */
export type PaginatedData<T, CollectionKey extends string = string> = {
  pagination: PaginationMeta;
} & Record<CollectionKey, T[]>;

// ---------------------------------------------------------------------------
// Request options — forwarded to the client (fetch) wrapper
// ---------------------------------------------------------------------------

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryValue = string | number | boolean | Date;
export type QueryValues = QueryValue | QueryValue[];
export type QueryParams = Record<string, QueryValues | null | undefined>;

export type PathParams = Record<string, string | number>;

/**
 * JSON-serialisable body. `FormData` and `Blob` are handled separately by
 * the client (no `Content-Type: application/json` / no JSON stringify).
 */
export type JsonBody = unknown;

export type RequestBody = JsonBody | FormData | Blob | undefined;

/**
 * Typed options for a single API request.
 *
 * `TResponse` is the expected shape of `ApiSuccess.data` (or `undefined`
 * for 204 No Content). `TBody` constrains the JSON body when `body` is not
 * `FormData`/`Blob`.
 *
 * - `path` is the resource path below `/v1` (e.g. `/products`, `/auth/login`);
 *   path parameters must be encoded via `params` + `encodeURIComponent` in the
 *   client, not interpolated by callers.
 * - `query` values `undefined`, `null`, and `""` are omitted by the URL
 *   builder; `false` and `0` are retained. Repeated keys via array values
 *   (`status: ["pending","paid"]`) are encoded as repeated query params.
 * - 204 / empty responses resolve to `undefined` without calling
 *   `response.json()`; success JSON goes through the envelope unwrap.
 */
// biome-ignore lint/correctness/noUnusedVariables: phantom type — tracks expected response shape for call-site typing
export interface ApiRequestOptions<TResponse = unknown, TBody = unknown> {
  method?: HttpMethod;
  path: string;
  params?: PathParams;
  query?: QueryParams;
  body?: TBody | FormData | Blob;
  /**
   * Forwarded as `fetch` `signal`. Aborts surface as an `ApiClientError`
   * with `code === "ABORTED"` rather than an untyped `DOMException`.
   */
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Error class — the only error type the API client rejects with
// ---------------------------------------------------------------------------

export interface ApiClientErrorOptions {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  method: HttpMethod;
  path: string;
  cause?: unknown;
}

/**
 * Typed error produced by the API client for every non-2xx or transport
 * failure.
 *
 * Fields mirror what the backend filter provides plus the request that
 * caused the error, so feature code can branch on `status`/`code` without
 * re-parsing a raw response.
 *
 * - `message` is normalised to a single `string` for display even when the
 *   backend sent `string[]` (joined with `"\n"`).
 * - `details` is the verbatim `error.details` from the envelope when present,
 *   otherwise the original validation array — never flattened or re-shaped.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly method: HttpMethod;
  readonly path: string;

  constructor(options: ApiClientErrorOptions) {
    super(options.message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.method = options.method;
    this.path = options.path;
    if (options.cause !== undefined) {
      (this as unknown as Record<string, unknown>).cause = options.cause;
    }
  }
}

// ---------------------------------------------------------------------------
// Type guards — avoid branching on untyped `success` checks at call sites
// ---------------------------------------------------------------------------

export function isApiSuccess<T>(
  envelope: ApiEnvelope<T>,
): envelope is ApiSuccess<T> {
  return envelope.success === true;
}

export function isApiFailure<T>(
  envelope: ApiEnvelope<T>,
): envelope is ApiFailure {
  return envelope.success === false;
}

/**
 * Public barrel for the dashboard API boundary (T16).
 *
 * This is the sole entry point for dashboard HTTP to the Nest e-commerce
 * backend. Feature code must import from "@/services/api" (this barrel) or
 * from the specific modules re-exported here — never from legacy
 * `endpoints.ts`, `queries.ts`, `table-query-map.ts`, `extract-errors.ts`,
 * or `types/api.ts`.
 *
 * Exports:
 * - Generic transport client (`request` / `apiClient`) — the only call site
 *   that invokes `fetch` for the Nest API (see `client.ts`).
 * - Transport contracts (`contracts.ts`) — ApiSuccess/ApiFailure envelopes,
 *   PaginationMeta, ApiRequestOptions, ApiClientError.
 * - Configuration helpers (`config.ts`) — getBackendUrl/getDashboardApiKey/
 *   buildApiUrl. No other module should read process.env for these keys.
 * - Error normalization (`errors.ts`) — parseApiResponse, ApiClientError, etc.
 * - Auth resources & single-flight refresh coordinator (`auth.ts`).
 * - Language/token resolver (`getLanguageAndToken.ts`) — server/client safe.
 * - Environment helper (`environment.ts`) — isServer/isClient.
 *
 * Do NOT re-export or shim old endpoint registries, old response envelopes
 * (`ApiResponse` `{statusCode,message,data}`), `ApiError` with `errors` map,
 * string-based endpoint constants, or old `PaginatedResponse`/`EndpointConfig`.
 * Those are intentionally absent. Old pages that still need pagination UI
 * should import the generic `PaginatedResponse` from `@/types/pagination`
 * (legacy UI helper, not a backend contract) until they are removed in T70.
 *
 * Direct `fetch` for Nest API is forbidden outside `client.ts` (and the
 * tightly-coupled `auth.ts` which also lives in `services/api/`). The only
 * other direct `fetch` call sites are:
 * - `src/auth.ts` — NextAuth `authorize` callback, which performs a one-shot
 *   `POST /auth/login` before any session exists. It uses `buildApiUrl` +
 *   `getDashboardApiKey` + `x-lang` + `credentials: 'include'` and does not
 *   log credentials. It is documented as the auth-boundary exception.
 * - `src/proxy.ts` — Edge middleware permission gate. Currently calls
 *   `GET /users/:id/permissions` with `X-Access-Api` + Bearer. This is a
 *   legacy endpoint that will be replaced in T21 by `GET /auth/me` via the
 *   new client. It is documented as the middleware exception.
 * Both are *not* feature-component fetches and are not to be duplicated.
 */

export type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  SessionResource,
  SessionsResponse,
} from "./auth.ts";
// Auth resources & session bridge (single-flight refresh coordinator)
export {
  AUTH_PATHS,
  clearLocalSession,
  clearStoredAccessToken,
  getCurrentUser,
  getMe,
  getStoredAccessToken,
  getStoredExpiresIn,
  isRetryEligible,
  listSessions,
  login,
  logout,
  refresh,
  refreshAccessToken,
  registerLogoutHook,
  revokeSession,
  setStoredAccessToken,
} from "./auth.ts";
// Generic transport — the only Nest-API fetch call site for feature code
export { apiClient, request } from "./client.ts";

// Configuration — validated env + URL builder (centralized)
export {
  buildApiUrl,
  buildUrl,
  getApiConfig,
  getBackendUrl,
  getBaseUrl,
  getDashboardApiKey,
} from "./config.ts";
// Contracts — the sole representation of Nest envelopes & request options
export type {
  ApiClientErrorOptions,
  ApiEnvelope,
  ApiErrorBody,
  ApiFailure,
  ApiRequestOptions,
  ApiResponseMeta,
  ApiSuccess,
  HttpMethod,
  JsonBody,
  PaginatedData,
  PaginationMeta,
  PathParams,
  QueryParams,
  QueryValue,
  QueryValues,
  RequestBody,
} from "./contracts.ts";
export { ApiClientError, isApiFailure, isApiSuccess } from "./contracts.ts";
// Environment — server/client detection (used by query client & auth)
export { isClient, isServer } from "./environment.ts";
export type {
  ApiEmptyResult,
  ApiFailureResult,
  ApiParseResult,
  ApiSuccessResult,
} from "./errors.ts";
// Error normalization — single error type for all HTTP/transport failures
export {
  codeForStatus,
  envelopeToApiClientError,
  isAbortError,
  normalizeMessage,
  normalizeTransportError,
  parseApiResponse,
  parseOrThrow,
} from "./errors.ts";
// Language/token — server/client safe resolver (used internally by client/auth)
export { getLanguageAndToken } from "./getLanguageAndToken.ts";

// ---------------------------------------------------------------------------
// Deprecated legacy default — keeps `import apiClient from "@/services/api"`
// compiling for old pages that will be deleted in T70. It is *not* a shim for
// the old string-based registry: it is simply the new `request` function
// exposed as `any` so `apiClient("users", {query})` type-checks but will
// throw at runtime if called with the legacy two-arg signature. New code must
// use `import { request } from "@/services/api"` or
// `import { apiClient } from "@/services/api"` (named).
// ---------------------------------------------------------------------------
import { request as _request } from "./client.ts";

// `any` default keeps legacy `apiClient<TResponse, TBody>("endpoint", {...})`
// compiling for old pages (old config: endpointName + ApiConfigOptions with
// `params`/`query`/`body`/`onSuccess`). Return is `any` so `res.data`
// type-checks. Pages are deprecated and will be removed in T70. New code must
// use `import { request }` with `path` + `contracts.ts` types.
type LegacyDefault = <TResponse = unknown, TBody = unknown>(
  ...args: unknown[]
) => Promise<any>;
export default _request as unknown as LegacyDefault;

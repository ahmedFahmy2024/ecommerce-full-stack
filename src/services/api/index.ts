/**
 * Public barrel for the dashboard API boundary (remediated T15/T16).
 *
 * The sole entry point for dashboard HTTP to the Nest e-commerce backend.
 * Feature code must import from "@/services/api" (this barrel) or the specific
 * modules re-exported here — never from legacy registries.
 *
 * Approved Nest-API `fetch` call sites (the only places that may call `fetch`
 * for the Nest origin):
 * - `services/api/client.ts` — generic transport (`request`/`apiClient`)
 * - `services/api/auth.ts` — auth resources (login/refresh/logout/me/sessions)
 * - `services/api/transport.ts` — narrowly shared header/URL/parsing helper used by both
 * - `services/api/session.client.ts` — client-only token store (no fetch, but
 *   part of the session boundary)
 *
 * No other file may call `fetch` for the Nest API. In particular:
 * - `src/auth.ts` (previously NextAuth Credentials) was removed — it performed a
 *   server-side fetch that could not deliver the HttpOnly `refresh_token` cookie
 *   to the browser. Use browser-direct `login()` from this barrel instead.
 * - `src/proxy.ts` no longer calls `GET /users/:id/permissions` — that route
 *   does not exist and caused false denials. Until T21 defines a real
 *   permission-aware route model, middleware performs only locale handling.
 * - No page/feature/component may call `fetch` directly — all go through `request`.
 *
 * Legacy default `apiClient("endpointName", options)` shim was intentionally
 * deleted in T16 remediation. Old code that still used `import apiClient from "@/services/api"`
 * with a string endpoint name would crash at runtime. Prefer deleting those
 * cloned education pages entirely (done in T16 remediation) rather than keeping
 * a compatibility cast that hides the crash.
 */

export type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  SessionResource,
  SessionsResponse,
  UnauthenticatedResult,
} from "./auth.ts";

export {
  AUTH_PATHS,
  clearLocalSession,
  getCurrentUser,
  getMe,
  isRetryEligible,
  listSessions,
  login,
  logout,
  refresh,
  refreshAccessToken,
  revokeSession,
  toUnauthenticated,
} from "./auth.ts";
// Generic transport — the only Nest-API fetch for feature code
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
// Contracts
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
// Environment
export { isClient, isServer } from "./environment.ts";
export type {
  ApiEmptyResult,
  ApiFailureResult,
  ApiParseResult,
  ApiSuccessResult,
} from "./errors.ts";
export {
  codeForStatus,
  envelopeToApiClientError,
  isAbortError,
  normalizeMessage,
  normalizeTransportError,
  parseApiResponse,
  parseOrThrow,
} from "./errors.ts";
export type { UnauthenticatedResult as SessionUnauthenticated } from "./session.client.ts";
// Session — client-only access token store (must not be imported by server/Edge)
export {
  clearSession,
  clearSessionAndNotify,
  getAccessToken,
  getExpiresIn,
  isAuthenticated,
  registerLogoutHook,
  setAccessToken,
  toUnauthenticated as toUnauthenticatedSession,
} from "./session.client.ts";
// Locale helper (client-safe x-lang resolution) — import from transport for direct use if needed
// Transport helper (narrowly shared) — exported for completeness but not for direct
// feature use; feature code should use `request` or `auth` resource functions.
export { normalizeLang, resolveLangSync, transportFetch } from "./transport.ts";

// NOTE: `getLanguageAndToken` (NextAuth-based) was removed in T15 remediation.
// It relied on `next-auth` server session and leaked between requests via the
// module-global token mirror. Locale is now resolved via `resolveLangSync` (cookie
// `inox`) and token via `session.client.ts`. Do not re-add a server token helper.

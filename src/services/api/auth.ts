/**
 * Authentication resource service for the Nest e-commerce backend (T15).
 *
 * Covers: POST /auth/login, POST /auth/refresh, POST /auth/logout,
 * GET /auth/me, GET /auth/sessions, DELETE /auth/sessions/:id
 *
 * Transport: uses `buildApiUrl` + `getDashboardApiKey` + `parseApiResponse`
 * exactly like `client.ts`. Every request sends `X-Access-Api`, `x-lang`,
 * `Accept: application/json`, `credentials: 'include'`, and `Authorization`
 * only when a short-lived access token is available. No token is ever logged.
 *
 * Session owner (T01): NextAuth Credentials JWT is the single owner. The
 * in-memory token store below mirrors the JWT for the API client's
 * `Authorization` header and is updated by `login` / `refresh` / `logout`.
 * The refresh token itself is never stored in JS — it is an HttpOnly
 * `refresh_token` cookie scoped to `/v1/auth/refresh` and sent automatically
 * via `credentials: 'include'`.
 *
 * Refresh coordinator: single-flight `POST /auth/refresh` on one eligible
 * authenticated 401, concurrent 401s await the same promise, retry original
 * GET exactly once, clear local state on failure.
 *
 * Never-retried automatically: login, logout, refresh, file uploads
 * (FormData/Blob), and all non-idempotent mutations (POST/PUT/PATCH/DELETE).
 */

import { buildApiUrl, getDashboardApiKey } from "./config.ts";
import { ApiClientError, type HttpMethod } from "./contracts.ts";
import { normalizeTransportError, parseApiResponse } from "./errors.ts";
import * as langMod from "./getLanguageAndToken.ts";

// ---------------------------------------------------------------------------
// Types — mirrors nest-ecommerce resources (no guessing)
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  emailVerifiedAt: string | Date | null;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  lastLoginAt: string | Date | null;
  avatarMediaId: string | null;
  // avatar?: MediaResource | null — omitted unless relation loaded; not needed for auth
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUser;
  refreshToken?: string; // absent for dashboard (cookie)
}

export interface RefreshRequest {
  deviceId?: string;
  deviceName?: string;
}

export interface RefreshResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken?: string; // absent for dashboard
}

export interface SessionResource {
  id: string;
  deviceName: string | null;
  platform: string;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
  current: boolean;
}

export interface SessionsResponse {
  sessions: SessionResource[];
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export const AUTH_PATHS = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",
  sessions: "/auth/sessions",
  sessionById: (id: string) => `/auth/sessions/${id}`,
} as const;

const NON_RETRY_PATHS = new Set<string>([
  AUTH_PATHS.login,
  AUTH_PATHS.refresh,
  AUTH_PATHS.logout,
]);

// ---------------------------------------------------------------------------
// Token store — single session owner bridge (NextAuth JWT <-> memory)
// ---------------------------------------------------------------------------

let _accessToken: string | undefined;
let _tokenExpiresIn: number | undefined;

export function getStoredAccessToken(): string | undefined {
  return _accessToken;
}

export function getStoredExpiresIn(): number | undefined {
  return _tokenExpiresIn;
}

export function setStoredAccessToken(
  token: string | undefined,
  expiresIn?: number,
): void {
  if (typeof token === "string" && token.trim().length > 0) {
    _accessToken = token.trim();
    _tokenExpiresIn = expiresIn;
  } else {
    _accessToken = undefined;
    _tokenExpiresIn = undefined;
  }
}

export function clearStoredAccessToken(): void {
  _accessToken = undefined;
  _tokenExpiresIn = undefined;
}

// Test hooks — production never calls these directly
export function __setStoredAccessTokenForTest(
  token: string | undefined,
  expiresIn?: number,
): void {
  if (token === undefined) {
    _accessToken = undefined;
    _tokenExpiresIn = undefined;
  } else {
    _accessToken = token;
    _tokenExpiresIn = expiresIn;
  }
}

export function __resetStoredAccessTokenForTest(): void {
  _accessToken = undefined;
  _tokenExpiresIn = undefined;
}

// ---------------------------------------------------------------------------
// Logout hooks — clean cache invalidation hook for T21+
// ---------------------------------------------------------------------------

type LogoutHook = () => void | Promise<void>;
const logoutHooks: LogoutHook[] = [];

export function registerLogoutHook(fn: LogoutHook): void {
  logoutHooks.push(fn);
}

export function __resetLogoutHooksForTest(): void {
  logoutHooks.length = 0;
}

async function runLogoutHooks(): Promise<void> {
  for (const fn of logoutHooks) {
    try {
      await fn();
    } catch {
      // hook failures must not block logout clearing
    }
  }
}

export async function clearLocalSession(): Promise<void> {
  clearStoredAccessToken();
  await runLogoutHooks();
}

// ---------------------------------------------------------------------------
// Language helper — reuses getLanguageAndToken for x-lang, falls back to en
// ---------------------------------------------------------------------------

async function resolveLang(): Promise<"en" | "ar"> {
  try {
    const { lang } = await langMod.getLanguageAndToken();
    return lang === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

// Test indirection for lang
let _getLangForTest: (() => Promise<"en" | "ar">) | null = null;
export function __setLangForTest(fn: () => Promise<"en" | "ar">): void {
  _getLangForTest = fn;
}
export function __resetLangForTest(): void {
  _getLangForTest = null;
}
async function getLang(): Promise<"en" | "ar"> {
  if (_getLangForTest) return _getLangForTest();
  return resolveLang();
}

// ---------------------------------------------------------------------------
// Retry eligibility — explicitly never retried
// ---------------------------------------------------------------------------

/**
 * Whether a failed request is eligible for single-flight refresh+retry.
 *
 * Never retried: login, logout, refresh, file uploads (FormData/Blob),
 * and all non-idempotent mutations (any method other than GET).
 */
export function isRetryEligible(options: {
  path: string;
  method?: HttpMethod | string;
  body?: unknown;
}): boolean {
  const normalizedPath = options.path.split("?")[0] ?? options.path;
  if (NON_RETRY_PATHS.has(normalizedPath)) return false;
  // Also block any sub-path of those (defensive)
  for (const p of NON_RETRY_PATHS) {
    if (normalizedPath === p || normalizedPath.startsWith(`${p}/`))
      return false;
  }
  if (options.body instanceof FormData) return false;
  if (typeof Blob !== "undefined" && options.body instanceof Blob) return false;
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") return false;
  return true;
}

// ---------------------------------------------------------------------------
// Single-flight refresh coordinator
// ---------------------------------------------------------------------------

let refreshPromise: Promise<string> | null = null;

async function performRefreshInternal(): Promise<string> {
  const lang = await getLang();
  const url = buildApiUrl(AUTH_PATHS.refresh);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Access-Api": getDashboardApiKey(),
    "x-lang": lang,
    "Content-Type": "application/json",
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({}),
    });
  } catch (cause) {
    throw normalizeTransportError(cause, "POST", AUTH_PATHS.refresh);
  }

  const result = await parseApiResponse<RefreshResponse>(response, {
    method: "POST",
    path: AUTH_PATHS.refresh,
  });

  if (result.kind === "failure") throw result.error;
  if (result.kind === "empty") {
    throw new ApiClientError({
      status: 500,
      code: "MALFORMED_RESPONSE",
      message: "Empty refresh response",
      method: "POST",
      path: AUTH_PATHS.refresh,
    });
  }

  const data = result.data;
  if (
    !data ||
    typeof data.accessToken !== "string" ||
    data.accessToken.trim().length === 0
  ) {
    throw new ApiClientError({
      status: 500,
      code: "MALFORMED_RESPONSE",
      message: "Invalid refresh response",
      method: "POST",
      path: AUTH_PATHS.refresh,
    });
  }

  setStoredAccessToken(data.accessToken, data.expiresIn);
  return data.accessToken;
}

/**
 * Single-flight entry point. Concurrent callers share the same promise.
 * On failure clears local session and propagates typed error.
 */
export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const token = await performRefreshInternal();
      return token;
    } catch (error) {
      await clearLocalSession();
      throw error;
    } finally {
      // keep promise until settled for coalescing, then clear
    }
  })();

  try {
    const token = await refreshPromise;
    return token;
  } finally {
    refreshPromise = null;
  }
}

export function __resetRefreshForTest(): void {
  refreshPromise = null;
}

// For client.ts to check ongoing refresh without importing internals
export function __getRefreshPromiseForTest(): Promise<string> | null {
  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Raw auth fetch helper (no auto-retry, no circular via client.ts)
// ---------------------------------------------------------------------------

async function authFetch<T>(
  path: string,
  method: HttpMethod,
  options: {
    body?: unknown;
    withAuth: boolean;
  },
): Promise<T | undefined> {
  const lang = await getLang();
  const url = buildApiUrl(path);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Access-Api": getDashboardApiKey(),
    "x-lang": lang,
  };

  let token: string | undefined;
  if (options.withAuth) {
    token =
      getStoredAccessToken() ??
      (
        await langMod.getLanguageAndToken().catch(
          () =>
            ({ token: undefined }) as unknown as {
              token: string | undefined;
            },
        )
      ).token;
    // fallback already handled; if we called via langMod we already have lang token
    // For stored-token path we already have token
    if (!token) {
      // As fallback, try langMod again directly (in case stored was undefined but langMod has it)
      try {
        const res = await langMod.getLanguageAndToken();
        token = res.token;
      } catch {
        token = undefined;
      }
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let bodyInit: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null && method !== "GET") {
    const body = options.body as unknown;
    if (body instanceof FormData) {
      bodyInit = body as BodyInit;
      delete headers["Content-Type"];
    } else if (typeof Blob !== "undefined" && body instanceof Blob) {
      bodyInit = body as BodyInit;
      if (headers["Content-Type"] === "application/json")
        delete headers["Content-Type"];
    } else if (typeof body === "string") {
      if (!headers["Content-Type"])
        headers["Content-Type"] = "application/json";
      bodyInit = body as BodyInit;
    } else {
      headers["Content-Type"] = "application/json";
      bodyInit = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: "include",
      ...(bodyInit !== undefined ? { body: bodyInit } : {}),
    });
  } catch (cause) {
    throw normalizeTransportError(cause, method, path);
  }

  const result = await parseApiResponse<T>(response, { method, path });
  if (result.kind === "success") return result.data;
  if (result.kind === "empty") return undefined;
  throw result.error;
}

// ---------------------------------------------------------------------------
// Exported resource functions (typed, no UI side effects)
// ---------------------------------------------------------------------------

/**
 * POST /auth/login — no Authorization, credentials include for refresh cookie.
 * Stores access token in the chosen session owner on success.
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const data = await authFetch<LoginResponse>(AUTH_PATHS.login, "POST", {
    body: {
      email: request.email,
      password: request.password,
      ...(request.deviceId ? { deviceId: request.deviceId } : {}),
      ...(request.deviceName ? { deviceName: request.deviceName } : {}),
    },
    withAuth: false,
  });

  if (!data || typeof data.accessToken !== "string") {
    throw new ApiClientError({
      status: 500,
      code: "MALFORMED_RESPONSE",
      message: "Invalid login response",
      method: "POST",
      path: AUTH_PATHS.login,
    });
  }

  setStoredAccessToken(data.accessToken, data.expiresIn);
  return data;
}

/**
 * POST /auth/refresh — cookie flow, no Authorization. Single-flight via
 * `refreshAccessToken()` for the retry coordinator; this helper is the raw
 * resource call without coalescing (used by the coordinator itself).
 */
export async function refresh(
  request: RefreshRequest = {},
): Promise<RefreshResponse> {
  const data = await authFetch<RefreshResponse>(AUTH_PATHS.refresh, "POST", {
    body: {
      ...(request.deviceId ? { deviceId: request.deviceId } : {}),
      ...(request.deviceName ? { deviceName: request.deviceName } : {}),
    },
    withAuth: false,
  });

  if (!data || typeof data.accessToken !== "string") {
    throw new ApiClientError({
      status: 500,
      code: "MALFORMED_RESPONSE",
      message: "Invalid refresh response",
      method: "POST",
      path: AUTH_PATHS.refresh,
    });
  }

  setStoredAccessToken(data.accessToken, data.expiresIn);
  return data;
}

/**
 * POST /auth/logout — requires Authorization + credentials, handles 204.
 * Clears local session even if backend is already invalid.
 */
export async function logout(): Promise<void> {
  try {
    await authFetch<void>(AUTH_PATHS.logout, "POST", {
      body: {},
      withAuth: true,
    });
  } catch (error) {
    // Logout is idempotent — 401/404 means already invalid, still clear local
    if (error instanceof ApiClientError) {
      if (error.status === 401 || error.status === 404) {
        // swallow — desired end state is already achieved
      } else {
        await clearLocalSession();
        throw error;
      }
    } else {
      await clearLocalSession();
      throw error;
    }
  } finally {
    await clearLocalSession();
  }
}

/**
 * GET /auth/me — authoritative current-user source, requires Bearer.
 * Uses dashboard key + Bearer token + x-lang.
 */
export async function getMe(): Promise<AuthUser> {
  const data = await authFetch<AuthUser>(AUTH_PATHS.me, "GET", {
    withAuth: true,
  });
  if (
    !data ||
    typeof (data as unknown as Record<string, unknown>).id !== "string"
  ) {
    throw new ApiClientError({
      status: 500,
      code: "MALFORMED_RESPONSE",
      message: "Invalid me response",
      method: "GET",
      path: AUTH_PATHS.me,
    });
  }
  return data as AuthUser;
}

/** Alias for callers expecting `getCurrentUser` naming */
export const getCurrentUser = getMe;

/**
 * GET /auth/sessions — list active sessions for current user.
 */
export async function listSessions(): Promise<SessionResource[]> {
  const data = await authFetch<SessionsResponse>(AUTH_PATHS.sessions, "GET", {
    withAuth: true,
  });
  if (!data || !Array.isArray((data as SessionsResponse).sessions)) {
    // Some backends may return directly array; normalize
    if (Array.isArray(data)) return data as unknown as SessionResource[];
    throw new ApiClientError({
      status: 500,
      code: "MALFORMED_RESPONSE",
      message: "Invalid sessions response",
      method: "GET",
      path: AUTH_PATHS.sessions,
    });
  }
  return (data as SessionsResponse).sessions;
}

/**
 * DELETE /auth/sessions/:id — revoke one session, 204 No Content.
 */
export async function revokeSession(id: string): Promise<void> {
  const path = AUTH_PATHS.sessionById(id);
  await authFetch<void>(path, "DELETE", {
    withAuth: true,
  });
}

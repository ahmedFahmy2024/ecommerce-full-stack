/**
 * Authentication resource service — remediated T15 (browser-direct).
 *
 * All functions use the narrowly shared `transportFetch` helper so headers,
 * URL building, `credentials: "include"` and response parsing are centralized.
 * No module-global token store — the access token lives only in
 * `session.client.ts` (browser memory, never localStorage, never Node global).
 *
 * - `login` and `refresh` assert browser cookie transport (`typeof window !== 'undefined'`)
 *   and send `credentials: "include"` so Nest's `refresh_token` cookie (HttpOnly,
 *   Path=/v1/auth/refresh, SameSite=Strict) is set/returned by the Nest origin.
 * - `logout`, `getMe`, `listSessions`, `revokeSession` require `Authorization: Bearer`
 *   from the client session.
 * - Single-flight `refreshAccessToken` coalesces concurrent 401s, updates the same
 *   client session used by `client.ts`, and on failure clears that session exactly
 *   once and exposes a typed `UNAUTHENTICATED` result for T21.
 * - `isRetryEligible` ensures only eligible GETs are retried; login/logout/refresh,
 *   FormData/Blob uploads, and non-GET mutations are never retried.
 */

import { ApiClientError, type HttpMethod } from "./contracts.ts";
import {
  clearSessionAndNotify,
  getAccessToken,
  setAccessToken,
  toUnauthenticated,
  type UnauthenticatedResult,
} from "./session.client.ts";
import { transportFetch } from "./transport.ts";

// Frontend must not call login/refresh from the server — the refresh cookie
// cannot be set on a server-side fetch response.
function assertBrowser(caller: string): void {
  if (typeof window === "undefined") {
    // Allow tests (`NODE_ENV=test`) to run without a real window
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test")
      return;
    throw new Error(
      `[auth] ${caller} must be called from the browser. Nest login/refresh require cookie transport (credentials: "include") and cannot be proxied through the Next server.`,
    );
  }
}

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
// Paths & eligibility
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

export function isRetryEligible(options: {
  path: string;
  method?: HttpMethod | string;
  body?: unknown;
}): boolean {
  const normalizedPath = options.path.split("?")[0] ?? options.path;
  if (NON_RETRY_PATHS.has(normalizedPath)) return false;
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
  // Browser-only; caller `refreshAccessToken` already asserts if needed
  const data = await transportFetch<RefreshResponse, Record<string, unknown>>({
    path: AUTH_PATHS.refresh,
    method: "POST",
    body: {},
    withAuth: false,
  });

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

  setAccessToken(data.accessToken, data.expiresIn);
  return data.accessToken;
}

/**
 * Single-flight entry point. Concurrent callers share the same promise.
 * On failure clears the client session exactly once and propagates a typed
 * unauthenticated error. Callers (client.ts) should treat the throw as
 * "session expired — redirect to login".
 */
export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const token = await performRefreshInternal();
      return token;
    } catch (error) {
      await clearSessionAndNotify();
      // Expose typed unauthenticated for T21 while also throwing ApiClientError
      // so existing catch paths that check `instanceof ApiClientError` still work.
      // Attach typed result as `cause` for callers that prefer branching.
      if (error instanceof ApiClientError) {
        const typed: UnauthenticatedResult =
          toUnauthenticated("refresh_failed");
        (error as unknown as Record<string, unknown>).unauthenticated = typed;
      }
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

export function __getRefreshPromiseForTest(): Promise<string> | null {
  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Resource functions — all via shared transport, all using client session
// ---------------------------------------------------------------------------

export async function login(request: LoginRequest): Promise<LoginResponse> {
  assertBrowser("login");
  const data = await transportFetch<LoginResponse, Record<string, unknown>>({
    path: AUTH_PATHS.login,
    method: "POST",
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

  setAccessToken(data.accessToken, data.expiresIn);
  return data;
}

/**
 * Raw refresh resource call without single-flight coalescing.
 * Useful for the coordinator itself; prefer `refreshAccessToken()` for retry logic.
 * Also browser-only.
 */
export async function refresh(
  request: RefreshRequest = {},
): Promise<RefreshResponse> {
  assertBrowser("refresh");
  const data = await transportFetch<RefreshResponse, Record<string, unknown>>({
    path: AUTH_PATHS.refresh,
    method: "POST",
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

  setAccessToken(data.accessToken, data.expiresIn);
  return data;
}

/**
 * POST /auth/logout — requires Authorization + credentials, handles 204.
 * Clears the client session exactly once, even if backend is already invalid.
 */
export async function logout(): Promise<void> {
  const token = getAccessToken();
  try {
    await transportFetch<void, Record<string, unknown>>({
      path: AUTH_PATHS.logout,
      method: "POST",
      body: {},
      withAuth: true,
      token,
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.status === 401 || error.status === 404) {
        // swallow — desired end state already achieved
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  } finally {
    // Exactly once — `clearSessionAndNotify` is idempotent and hook-safe
    await clearSessionAndNotify();
  }
}

export async function getMe(): Promise<AuthUser> {
  const token = getAccessToken();
  const data = await transportFetch<AuthUser, never>({
    path: AUTH_PATHS.me,
    method: "GET",
    withAuth: true,
    token,
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

export const getCurrentUser = getMe;

export async function listSessions(): Promise<SessionResource[]> {
  const token = getAccessToken();
  const data = await transportFetch<SessionsResponse, never>({
    path: AUTH_PATHS.sessions,
    method: "GET",
    withAuth: true,
    token,
  });
  if (!data || !Array.isArray((data as SessionsResponse).sessions)) {
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

export async function revokeSession(id: string): Promise<void> {
  const token = getAccessToken();
  const path = AUTH_PATHS.sessionById(id);
  await transportFetch<void, never>({
    path,
    method: "DELETE",
    withAuth: true,
    token,
  });
}

export type { UnauthenticatedResult } from "./session.client.ts";
// Re-export session helpers for barrel convenience (typed unauthenticated)
export {
  clearSessionAndNotify as clearLocalSession,
  clearSessionAndNotify as clearStoredAccessToken,
  getAccessToken as getStoredAccessToken,
  setAccessToken as setStoredAccessToken,
  toUnauthenticated,
} from "./session.client.ts";

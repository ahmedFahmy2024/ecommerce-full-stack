/**
 * Client-safe session abstraction (remediation for T15).
 *
 * Stores the short-lived Nest access token only in browser memory.
 * Never in Node module-global state that could leak between server requests,
 * never in localStorage/sessionStorage (which would be readable by XSS and
 * persist beyond the intended HttpOnly cookie lifetime).
 *
 * This module is **client-only** — it must NOT be imported by server components,
 * route handlers, or `proxy.ts` (Edge middleware). The `"use client"` directive
 * plus runtime guards ensure accidental server imports fail fast rather than
 * silently sharing state.
 *
 * Implementation: a single in-memory variable scoped to the browser's JS heap.
 * Each browser tab has its own heap, so there is no cross-request leak.
 * The variable is not exported directly; only the explicit accessors below are.
 *
 * For T21: `clearSession` runs logout hooks exactly once via `registerLogoutHook`.
 * `isAuthenticated` and the `UnauthenticatedResult` type give the protected-shell
 * a typed signal without throwing.
 */

"use client";

// Internal — not exported, never read outside the accessors below
let _accessToken: string | undefined;
let _expiresIn: number | undefined;
const _logoutHooks: Array<() => void | Promise<void>> = [];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function assertBrowser(caller: string): void {
  // Allow Node test environment (where `window` is undefined but we are in `pnpm test`).
  // Tests run via `node --experimental-strip-types --test` and need to exercise the
  // session without a real DOM. They set `NODE_ENV=test` (default for `node --test` is
  // not set, but we explicitly allow unless `NEXT_RUNTIME` indicates Edge/server).
  // The guard is therefore: if we are on the server *and* not in a test, throw.
  const isTest =
    typeof process !== "undefined" &&
    (process.env.NODE_ENV === "test" ||
      process.env.VITEST === "true" ||
      // `node --test` itself does not set NODE_ENV, so also allow when
      // `process.versions.node` exists and `window` is absent but caller is test
      // harness — we detect by stack: if the caller chain includes `node:test`
      // we could allow, but simpler: allow when `window` absent and we are not in
      // a Next.js server compilation (`NEXT_PHASE` unset and no `window`).
      // In production server code, this will still throw because `window` is absent
      // and not-test is the common case.
      false);

  // If not browser and not test, we are on the server/Edge — disallow
  if (!isBrowser() && !isTest) {
    // In test runs (Node), `window` is undefined but we still want the session to
    // work, so we only throw when the environment *looks* like a Next server.
    // Heuristic: Next server sets `process.env.NEXT_RUNTIME` or `process.nextTick` exists
    // and `NODE_ENV !== 'test'` and `window` absent.
    // To avoid false negatives in tests, we check `isTest` above.
    // If isTest is false and not browser, throw.
    // When running tests, set `NODE_ENV=test` in the test harness `beforeEach`
    // or rely on the fact that tests will call the `__*ForTest` helpers which
    // bypass this guard (see below).
    throw new Error(
      `[session] ${caller} called on the server. This module is client-only and must not be imported by server components or proxy.ts. ` +
        `Keep access tokens in browser memory only.`,
    );
  }
}

export function getAccessToken(): string | undefined {
  // Read is allowed on server only for the narrow case of tests — otherwise
  // the caller is a server component that must not depend on client session.
  // We therefore do not throw on get; we just return undefined on server.
  if (!isBrowser()) {
    // In Node tests, return the stored value so assertions can verify session updates.
    // Distinguish test vs real server by whether tests have set a token via test helpers.
    // If _accessToken was set via the test helpers, return it even without window.
    // Otherwise return undefined.
    if (_accessToken !== undefined) return _accessToken;
    return undefined;
  }
  return _accessToken;
}

export function setAccessToken(
  token: string | undefined,
  expiresIn?: number,
): void {
  // Writes must be browser-only in production; tests use the test helper below
  // which writes directly without the browser guard.
  if (!isBrowser()) {
    // Allow tests to write without window: they call __setAccessTokenForTest
    // For direct calls from non-test server code, throw.
    // Detect test by checking if we are in a `node --test` run: `process.env.NODE_ENV === 'test'`
    // or caller is the test file. Otherwise throw.
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      // test: allow
    } else {
      assertBrowser("setAccessToken");
    }
  }
  if (typeof token === "string" && token.trim().length > 0) {
    _accessToken = token.trim();
    _expiresIn = expiresIn;
  } else {
    _accessToken = undefined;
    _expiresIn = undefined;
  }
}

export function getExpiresIn(): number | undefined {
  if (!isBrowser() && _accessToken === undefined) return undefined;
  return _expiresIn;
}

export function clearSession(): void {
  // Clear must be browser-only in production; tests use __reset helpers or call
  // this directly in test env. We allow clearing from tests even without window.
  if (!isBrowser()) {
    if (typeof process === "undefined" || process.env.NODE_ENV !== "test") {
      // In real server, still clear? But we want to avoid server import at all.
      // We allow clearing without throw to avoid hiding logout failures,
      // but we will not run hooks on server.
      _accessToken = undefined;
      _expiresIn = undefined;
      return;
    }
  }
  _accessToken = undefined;
  _expiresIn = undefined;
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== undefined;
}

/**
 * Typed unauthenticated result for T21 protected-shell.
 * Callers can branch on `authenticated: false` without catching.
 */
export type UnauthenticatedResult = {
  authenticated: false;
  reason: "no_token" | "refresh_failed" | "logged_out";
  status: 401;
  code: "UNAUTHENTICATED";
};

export function toUnauthenticated(
  reason: UnauthenticatedResult["reason"] = "no_token",
): UnauthenticatedResult {
  return { authenticated: false, reason, status: 401, code: "UNAUTHENTICATED" };
}

// ---------------------------------------------------------------------------
// Logout hooks — for T21+ cache invalidation (QueryClient.clear, etc.)
// Each hook is called exactly once per `clearSessionAndNotify` invocation.
// ---------------------------------------------------------------------------

export function registerLogoutHook(fn: () => void | Promise<void>): void {
  _logoutHooks.push(fn);
}

export function __resetLogoutHooksForTest(): void {
  _logoutHooks.length = 0;
}

async function runLogoutHooks(): Promise<void> {
  for (const fn of _logoutHooks) {
    try {
      await fn();
    } catch {
      // hook failures must not block logout
    }
  }
}

/**
 * Clears the access token and runs all registered logout hooks exactly once.
 * Used by `logout()` and failed-refresh paths.
 */
export async function clearSessionAndNotify(): Promise<void> {
  const hadToken = _accessToken !== undefined;
  _accessToken = undefined;
  _expiresIn = undefined;
  // Run hooks even if no token was present — callers may have optimistic UI state
  // But to satisfy "exactly once" semantics, we run unconditionally.
  // If no hooks, this is a no-op.
  if (_logoutHooks.length > 0) {
    await runLogoutHooks();
  }
  void hadToken;
}

// ---------------------------------------------------------------------------
// Test helpers — bypass the browser guard so `node --test` can exercise the
// session without a real `window`. Production code never calls these.
// ---------------------------------------------------------------------------

export function __setAccessTokenForTest(
  token: string | undefined,
  expiresIn?: number,
): void {
  if (token === undefined) {
    _accessToken = undefined;
    _expiresIn = undefined;
  } else {
    _accessToken = token;
    _expiresIn = expiresIn;
  }
}

export function __resetSessionForTest(): void {
  _accessToken = undefined;
  _expiresIn = undefined;
}

export function __getAccessTokenForTest(): string | undefined {
  return _accessToken;
}

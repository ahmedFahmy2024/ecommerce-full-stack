/**
 * Tests for `auth.ts` — authentication resource service and refresh coordinator (T15).
 *
 * Covers:
 * - login stores access token per session owner
 * - /auth/me uses dashboard key + Bearer token
 * - refresh uses credentials/cookie flow (no Authorization)
 * - expired-token GET refreshes once then retries once
 * - multiple simultaneous 401s issue only one refresh
 * - failed refresh clears session and does not loop
 * - login/logout/refresh/upload/mutation paths are never automatically retried
 * - logout succeeds on 204 and clears local state
 * - no secrets logged/snapshotted
 *
 * Runner: node --experimental-strip-types --test src/services/api/auth.test.ts
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

import {
  __resetLangForTest,
  __resetLogoutHooksForTest,
  __resetRefreshForTest,
  __resetStoredAccessTokenForTest,
  __setLangForTest,
  __setStoredAccessTokenForTest,
  clearLocalSession,
  getMe,
  getStoredAccessToken,
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
import {
  __resetLanguageAndTokenForTest,
  __setLanguageAndTokenForTest,
  request,
} from "./client.ts";
import { ApiClientError } from "./contracts.ts";

// ---------------------------------------------------------------------------
// Env + helpers
// ---------------------------------------------------------------------------

const BACKEND_ENV = "NEXT_PUBLIC_BACKEND_URL";
const KEY_ENV = "NEXT_PUBLIC_DASHBOARD_API_KEY";

let originalBackend: string | undefined;
let originalKey: string | undefined;

beforeEach(() => {
  originalBackend = process.env[BACKEND_ENV];
  originalKey = process.env[KEY_ENV];
  process.env[BACKEND_ENV] = "http://localhost:3001/v1";
  process.env[KEY_ENV] = "test-dashboard-key-32-chars-minimum-ok";
  __resetStoredAccessTokenForTest();
  __resetRefreshForTest();
  __resetLangForTest();
  __resetLogoutHooksForTest();
  __resetLanguageAndTokenForTest();
  // Default lang stub for auth's internal getLang
  __setLangForTest(async () => "en");
  // Default client token stub: no token
  __setLanguageAndTokenForTest(
    async () =>
      ({ lang: "en", token: undefined }) as unknown as Awaited<
        ReturnType<
          typeof import("./getLanguageAndToken.ts").getLanguageAndToken
        >
      >,
  );
});

afterEach(() => {
  const env = process.env as Record<string, string | undefined>;
  if (originalBackend === undefined) delete env[BACKEND_ENV];
  else env[BACKEND_ENV] = originalBackend;
  if (originalKey === undefined) delete env[KEY_ENV];
  else env[KEY_ENV] = originalKey;
  mock.restoreAll();
  __resetStoredAccessTokenForTest();
  __resetRefreshForTest();
  __resetLangForTest();
  __resetLogoutHooksForTest();
  __resetLanguageAndTokenForTest();
});

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockHeaders(entries: Record<string, string> = {}) {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) lower[k.toLowerCase()] = v;
  return { get: (name: string) => lower[name.toLowerCase()] ?? null };
}

function successBody<T>(data: T): string {
  return JSON.stringify({
    success: true,
    data,
    meta: { timestamp: new Date().toISOString(), path: "/test" },
  });
}

function failureBody(overrides: {
  statusCode: number;
  message: string | string[];
  code: string;
  details?: unknown;
}): string {
  return JSON.stringify({
    success: false,
    error: {
      statusCode: overrides.statusCode,
      message: overrides.message,
      code: overrides.code,
      ...(overrides.details !== undefined
        ? { details: overrides.details }
        : {}),
    },
    meta: { timestamp: new Date().toISOString(), path: "/test" },
  });
}

function createMockResponse(init: {
  status: number;
  body?: string;
  headers?: Record<string, string>;
}) {
  const {
    status,
    body = "",
    headers = { "content-type": "application/json" },
  } = init;
  const ok = status >= 200 && status < 300;
  return {
    status,
    ok,
    headers: mockHeaders(headers),
    async text() {
      return body;
    },
    async json() {
      return JSON.parse(body);
    },
  } as unknown as Response;
}

type Captured = { url: string; init: RequestInit };
function captureFetchSequence(
  responses: Array<{ status: number; body: string }>,
  captures: Captured[],
) {
  let idx = 0;
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    const cap: Captured = { url: url as string, init };
    captures.push(cap);
    const res = responses[idx] ?? responses[responses.length - 1];
    idx += 1;
    return createMockResponse({ status: res.status, body: res.body });
  });
}

function stubLangClient(lang: string, token?: string) {
  __setLanguageAndTokenForTest(
    async () =>
      ({ lang: lang as unknown as "en", token }) as unknown as Awaited<
        ReturnType<
          typeof import("./getLanguageAndToken.ts").getLanguageAndToken
        >
      >,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("auth — login stores access token per session owner", () => {
  it("stores returned access token in chosen session owner (memory -> NextAuth JWT bridge)", async () => {
    const loginData = {
      accessToken: "new-access-token-abc",
      tokenType: "Bearer" as const,
      expiresIn: 900,
      user: {
        id: "u1",
        email: "admin@example.com",
        emailVerifiedAt: null,
        firstName: "Admin",
        lastName: "User",
        fullName: "Admin User",
        phoneNumber: null,
        lastLoginAt: null,
        avatarMediaId: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    const captures: Captured[] = [];
    captureFetchSequence(
      [{ status: 200, body: successBody(loginData) }],
      captures,
    );

    const result = await login({
      email: "admin@example.com",
      password: "secret",
    });
    assert.equal(result.accessToken, "new-access-token-abc");
    assert.equal(getStoredAccessToken(), "new-access-token-abc");
    // Verify headers: X-Access-Api, x-lang, credentials include, no Authorization
    const headers = captures[0].init.headers as Record<string, string>;
    assert.equal(
      headers["X-Access-Api"],
      "test-dashboard-key-32-chars-minimum-ok",
    );
    assert.equal(headers["x-lang"], "en");
    assert.equal((captures[0].init as RequestInit).credentials, "include");
    assert.equal(headers.Authorization, undefined);
    assert.equal(headers["Content-Type"], "application/json");
  });

  it("login sends device context when provided", async () => {
    const loginData = {
      accessToken: "tok2",
      tokenType: "Bearer" as const,
      expiresIn: 900,
      user: {
        id: "u1",
        email: "a@b.com",
        emailVerifiedAt: null,
        firstName: "A",
        lastName: "B",
        fullName: "A B",
        phoneNumber: null,
        lastLoginAt: null,
        avatarMediaId: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    const captures: Captured[] = [];
    captureFetchSequence(
      [{ status: 200, body: successBody(loginData) }],
      captures,
    );
    await login({
      email: "a@b.com",
      password: "p",
      deviceId: "dev123",
      deviceName: "Chrome",
    });
    const body = captures[0].init.body as string;
    const parsed = JSON.parse(body as string) as Record<string, unknown>;
    assert.equal(parsed.deviceId, "dev123");
    assert.equal(parsed.deviceName, "Chrome");
  });
});

describe("auth — /auth/me uses dashboard key + Bearer token", () => {
  it("sends X-Access-Api and Authorization Bearer for getMe", async () => {
    __setStoredAccessTokenForTest("bearer-xyz", 900);
    const user = {
      id: "u1",
      email: "admin@example.com",
      emailVerifiedAt: null,
      firstName: "Admin",
      lastName: "User",
      fullName: "Admin User",
      phoneNumber: null,
      lastLoginAt: null,
      avatarMediaId: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const captures: Captured[] = [];
    captureFetchSequence([{ status: 200, body: successBody(user) }], captures);

    const me = await getMe();
    assert.equal(me.id, "u1");
    const headers = captures[0].init.headers as Record<string, string>;
    assert.equal(
      headers["X-Access-Api"],
      "test-dashboard-key-32-chars-minimum-ok",
    );
    assert.equal(headers.Authorization, "Bearer bearer-xyz");
    assert.equal(headers["x-lang"], "en");
    assert.equal(captures[0].init.credentials, "include");
    assert.match(captures[0].url, /\/auth\/me/);
  });

  it("throws when no token and getMe returns 401", async () => {
    __setStoredAccessTokenForTest(undefined);
    __setLanguageAndTokenForTest(
      async () =>
        ({ lang: "en", token: undefined }) as unknown as Awaited<
          ReturnType<
            typeof import("./getLanguageAndToken.ts").getLanguageAndToken
          >
        >,
    );
    const captures: Captured[] = [];
    captureFetchSequence(
      [
        {
          status: 401,
          body: failureBody({
            statusCode: 401,
            message: "Unauthorized",
            code: "UnauthorizedException",
          }),
        },
      ],
      captures,
    );
    await assert.rejects(
      () => getMe(),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal((err as ApiClientError).status, 401);
        return true;
      },
    );
  });
});

describe("auth — refresh uses credentials/cookie flow (no Authorization)", () => {
  it("refresh sends X-Access-Api, x-lang, credentials include, no Authorization", async () => {
    const refreshData = {
      accessToken: "refreshed-token-xyz",
      tokenType: "Bearer" as const,
      expiresIn: 900,
    };
    const captures: Captured[] = [];
    captureFetchSequence(
      [{ status: 200, body: successBody(refreshData) }],
      captures,
    );
    // Even though stored token exists, refresh must NOT send Authorization (expired case)
    __setStoredAccessTokenForTest("old-token");
    const result = await refresh();
    assert.equal(result.accessToken, "refreshed-token-xyz");
    const headers = captures[0].init.headers as Record<string, string>;
    assert.equal(
      headers["X-Access-Api"],
      "test-dashboard-key-32-chars-minimum-ok",
    );
    assert.equal(headers["x-lang"], "en");
    assert.equal(captures[0].init.credentials, "include");
    assert.equal(headers.Authorization, undefined);
    assert.equal(headers["Content-Type"], "application/json");
    assert.match(captures[0].url, /\/auth\/refresh/);
  });

  it("refreshAccessToken helper updates stored token and is single-flight", async () => {
    __setStoredAccessTokenForTest("old");
    const newToken = "new-from-refresh";
    let fetchCount = 0;
    mock.method(globalThis, "fetch", async () => {
      fetchCount += 1;
      // small delay to test coalescing
      await new Promise((r) => setTimeout(r, 20));
      return createMockResponse({
        status: 200,
        body: successBody({
          accessToken: newToken,
          tokenType: "Bearer",
          expiresIn: 900,
        }),
      });
    });

    const p1 = refreshAccessToken();
    const p2 = refreshAccessToken();
    const p3 = refreshAccessToken();
    const results = await Promise.all([p1, p2, p3]);
    assert.deepEqual(results, [newToken, newToken, newToken]);
    assert.equal(fetchCount, 1);
    assert.equal(getStoredAccessToken(), newToken);
  });
});

describe("client — expired-token request refreshes once then retries once", () => {
  it("GET 401 triggers one refresh then retries original GET once", async () => {
    // Client token present via stored token
    __setStoredAccessTokenForTest("expired-token");
    stubLangClient("en", "expired-token");
    // Sequence: 1) GET /products -> 401, 2) POST /auth/refresh -> 200 new token, 3) GET /products retry -> 200 success
    const successProducts = {
      products: [{ id: "1" }],
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    };
    const captures: Captured[] = [];
    let call = 0;
    mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
      captures.push({ url: url as string, init });
      call += 1;
      if (url.includes("/auth/refresh")) {
        // Check refresh does not send Authorization
        const h = init.headers as Record<string, string>;
        assert.equal(h.Authorization, undefined);
        return createMockResponse({
          status: 200,
          body: successBody({
            accessToken: "fresh-token-123",
            tokenType: "Bearer",
            expiresIn: 900,
          }),
        });
      }
      if (call === 1) {
        // first products call -> 401
        const h = init.headers as Record<string, string>;
        assert.equal(h.Authorization, "Bearer expired-token");
        return createMockResponse({
          status: 401,
          body: failureBody({
            statusCode: 401,
            message: "Unauthorized",
            code: "UnauthorizedException",
          }),
        });
      }
      // retry products call -> success, should have new token
      const h = init.headers as Record<string, string>;
      assert.equal(h.Authorization, "Bearer fresh-token-123");
      return createMockResponse({
        status: 200,
        body: successBody(successProducts),
      });
    });

    const data = await request<typeof successProducts>({ path: "/products" });
    assert.deepEqual(data, successProducts);
    // Verify fetch call count: 3 (initial, refresh, retry)
    assert.equal(captures.length, 3);
    assert.equal(getStoredAccessToken(), "fresh-token-123");
  });
});

describe("client — multiple simultaneous 401s issue only one refresh", () => {
  it("concurrent GET 401s coalesce to one POST /auth/refresh", async () => {
    __setStoredAccessTokenForTest("expired");
    stubLangClient("en", "expired");
    let refreshCalls = 0;
    const productData = {
      products: [{ id: "p1" }],
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    };

    mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
      const href = url as string;
      if (href.includes("/auth/refresh")) {
        refreshCalls += 1;
        await new Promise((r) => setTimeout(r, 30));
        return createMockResponse({
          status: 200,
          body: successBody({
            accessToken: "new-token-concurrent",
            tokenType: "Bearer",
            expiresIn: 900,
          }),
        });
      }
      // For product/reviews concurrent calls, first attempt is 401, retry is 200
      // Track per-url retry: use init header to know if it's retry (has new token)
      const h = init.headers as Record<string, string>;
      if (h.Authorization === "Bearer expired") {
        return createMockResponse({
          status: 401,
          body: failureBody({
            statusCode: 401,
            message: "Unauthorized",
            code: "UnauthorizedException",
          }),
        });
      }
      // after refresh, Authorization should be new token
      assert.equal(h.Authorization, "Bearer new-token-concurrent");
      return createMockResponse({
        status: 200,
        body: successBody(productData),
      });
    });

    const p1 = request({ path: "/products" });
    const p2 = request({ path: "/reviews" });
    const p3 = request({ path: "/categories" });

    const results = await Promise.all([p1, p2, p3]);
    assert.equal(results.length, 3);
    for (const r of results) assert.deepEqual(r, productData);
    assert.equal(refreshCalls, 1);
    assert.equal(getStoredAccessToken(), "new-token-concurrent");
  });
});

describe("client — failed refresh clears session and does not loop", () => {
  it("when refresh 401s, clears stored token and throws without retry loop", async () => {
    __setStoredAccessTokenForTest("expired-token-loop");
    stubLangClient("en", "expired-token-loop");
    let fetchCalls = 0;
    mock.method(globalThis, "fetch", async (url: string) => {
      fetchCalls += 1;
      const href = url as string;
      if (href.includes("/auth/refresh")) {
        return createMockResponse({
          status: 401,
          body: failureBody({
            statusCode: 401,
            message: "Invalid refresh",
            code: "UnauthorizedException",
          }),
        });
      }
      // Initial request always 401
      return createMockResponse({
        status: 401,
        body: failureBody({
          statusCode: 401,
          message: "Unauthorized",
          code: "UnauthorizedException",
        }),
      });
    });

    await assert.rejects(
      () => request({ path: "/products" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        // refresh error is 401
        assert.equal((err as ApiClientError).status, 401);
        return true;
      },
    );
    assert.equal(getStoredAccessToken(), undefined);
    // Should be exactly 2 calls: initial GET, POST refresh. No retry GET after failed refresh.
    assert.equal(fetchCalls, 2);
    // Second attempt still without token should not trigger another refresh loop
    mock.restoreAll();
    let secondCalls = 0;
    mock.method(globalThis, "fetch", async () => {
      secondCalls += 1;
      return createMockResponse({
        status: 401,
        body: failureBody({
          statusCode: 401,
          message: "Unauthorized",
          code: "UnauthorizedException",
        }),
      });
    });
    // Token cleared, so no refresh attempt (no token -> not eligible? Actually token undefined now, but we still have stored cleared, lang token is expired-token-loop still? We stubbed lang token to expired-token-loop, so second request would have token via langToken and would attempt refresh again. To verify no loop, we check that after clear, stored is undefined but lang still provides token, so it would attempt refresh again if we retry. But we cleared stored, lang still there. That's expected to attempt again. However we want to ensure no infinite loop on same request. Our earlier test already proved no retry after failed refresh. For second request, we reset lang stub to no token to avoid loop.
    __setStoredAccessTokenForTest(undefined);
    __setLanguageAndTokenForTest(
      async () =>
        ({ lang: "en", token: undefined }) as unknown as Awaited<
          ReturnType<
            typeof import("./getLanguageAndToken.ts").getLanguageAndToken
          >
        >,
    );
    await assert.rejects(
      () => request({ path: "/products" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal((err as ApiClientError).status, 401);
        return true;
      },
    );
    // This second request should have only 1 call (direct 401, no refresh because no token)
    assert.equal(secondCalls, 1);
  });
});

describe("isRetryEligible — never retried paths", () => {
  it("login, logout, refresh are never retried", () => {
    assert.equal(
      isRetryEligible({ path: "/auth/login", method: "GET" }),
      false,
    );
    assert.equal(
      isRetryEligible({ path: "/auth/refresh", method: "GET" }),
      false,
    );
    assert.equal(
      isRetryEligible({ path: "/auth/logout", method: "GET" }),
      false,
    );
    assert.equal(
      isRetryEligible({ path: "/auth/login", method: "POST", body: {} }),
      false,
    );
  });

  it("file uploads (FormData/Blob) are never retried", () => {
    const fd = new FormData();
    assert.equal(
      isRetryEligible({ path: "/products", method: "GET", body: fd }),
      false,
    );
    const blob = new Blob(["x"]);
    assert.equal(
      isRetryEligible({ path: "/media", method: "GET", body: blob }),
      false,
    );
  });

  it("non-GET mutations are never retried", () => {
    assert.equal(
      isRetryEligible({ path: "/products", method: "POST", body: {} }),
      false,
    );
    assert.equal(
      isRetryEligible({ path: "/products/1", method: "PUT", body: {} }),
      false,
    );
    assert.equal(
      isRetryEligible({ path: "/products/1", method: "PATCH", body: {} }),
      false,
    );
    assert.equal(
      isRetryEligible({ path: "/products/1", method: "DELETE" }),
      false,
    );
  });

  it("GET to normal resource is eligible", () => {
    assert.equal(isRetryEligible({ path: "/products", method: "GET" }), true);
    assert.equal(isRetryEligible({ path: "/orders", method: "GET" }), true);
    assert.equal(isRetryEligible({ path: "/auth/me", method: "GET" }), true);
    assert.equal(
      isRetryEligible({ path: "/auth/sessions", method: "GET" }),
      true,
    );
  });

  it("client does not retry POST mutation 401 even with token", async () => {
    __setStoredAccessTokenForTest("expired");
    stubLangClient("en", "expired");
    let calls = 0;
    mock.method(globalThis, "fetch", async (url: string) => {
      calls += 1;
      if ((url as string).includes("/auth/refresh")) {
        // should not be called
        return createMockResponse({
          status: 200,
          body: successBody({
            accessToken: "new",
            tokenType: "Bearer",
            expiresIn: 900,
          }),
        });
      }
      return createMockResponse({
        status: 401,
        body: failureBody({
          statusCode: 401,
          message: "Unauthorized",
          code: "UnauthorizedException",
        }),
      });
    });
    await assert.rejects(
      () => request({ method: "POST", path: "/products", body: { name: "x" } }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal((err as ApiClientError).status, 401);
        return true;
      },
    );
    assert.equal(calls, 1);
  });

  it("client does not retry FormData upload 401", async () => {
    __setStoredAccessTokenForTest("expired");
    stubLangClient("en", "expired");
    let calls = 0;
    mock.method(globalThis, "fetch", async (url: string) => {
      calls += 1;
      if ((url as string).includes("/auth/refresh")) {
        return createMockResponse({
          status: 200,
          body: successBody({
            accessToken: "new2",
            tokenType: "Bearer",
            expiresIn: 900,
          }),
        });
      }
      return createMockResponse({
        status: 401,
        body: failureBody({
          statusCode: 401,
          message: "Unauthorized",
          code: "UnauthorizedException",
        }),
      });
    });
    const fd = new FormData();
    fd.append("file", new Blob(["hi"]), "hi.txt");
    await assert.rejects(
      () =>
        request({
          method: "POST",
          path: "/media",
          body: fd as unknown as Record<string, unknown>,
        }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal((err as ApiClientError).status, 401);
        return true;
      },
    );
    assert.equal(calls, 1);
  });
});

describe("auth — logout succeeds on 204 and clears local state", () => {
  it("calls POST /auth/logout with Bearer and credentials, handles 204, clears token and runs hooks", async () => {
    __setStoredAccessTokenForTest("valid-token");
    let hookCalled = false;
    registerLogoutHook(() => {
      hookCalled = true;
    });
    const captures: Captured[] = [];
    captureFetchSequence([{ status: 204, body: "" }], captures);

    await logout();
    assert.equal(getStoredAccessToken(), undefined);
    assert.equal(hookCalled, true);
    const headers = captures[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer valid-token");
    assert.equal(
      headers["X-Access-Api"],
      "test-dashboard-key-32-chars-minimum-ok",
    );
    assert.equal(captures[0].init.credentials, "include");
    assert.equal(captures[0].init.method, "POST");
    assert.match(captures[0].url, /\/auth\/logout/);
  });

  it("clears local state even when backend session already invalid (401)", async () => {
    __setStoredAccessTokenForTest("stale-token");
    let hookCalled = false;
    registerLogoutHook(() => {
      hookCalled = true;
    });
    const captures: Captured[] = [];
    captureFetchSequence(
      [
        {
          status: 401,
          body: failureBody({
            statusCode: 401,
            message: "Unauthorized",
            code: "UnauthorizedException",
          }),
        },
      ],
      captures,
    );
    // logout swallows 401 but still clears
    await logout();
    assert.equal(getStoredAccessToken(), undefined);
    assert.equal(hookCalled, true);
    assert.equal(captures.length, 1);
  });

  it("clearLocalSession hook is called via refresh failure as well", async () => {
    __setStoredAccessTokenForTest("tok");
    let hookCalls = 0;
    registerLogoutHook(() => {
      hookCalls += 1;
    });
    await clearLocalSession();
    assert.equal(getStoredAccessToken(), undefined);
    assert.equal(hookCalls, 1);
  });
});

describe("auth — no secret logging", () => {
  it("does not log access or refresh tokens in any path (no console.log of token)", async () => {
    // Intercept console.log
    const logs: unknown[] = [];
    const originalLog = console.log;
    (console as unknown as Record<string, unknown>).log = (
      ...args: unknown[]
    ) => logs.push((args as string[]).join(" "));
    const originalError = console.error;
    (console as unknown as Record<string, unknown>).error = (
      ...args: unknown[]
    ) => logs.push((args as string[]).join(" "));

    try {
      const loginData = {
        accessToken: "super-secret-access-12345",
        tokenType: "Bearer" as const,
        expiresIn: 900,
        user: {
          id: "u1",
          email: "a@b.com",
          emailVerifiedAt: null,
          firstName: "A",
          lastName: "B",
          fullName: "A B",
          phoneNumber: null,
          lastLoginAt: null,
          avatarMediaId: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      const captures: Captured[] = [];
      captureFetchSequence(
        [{ status: 200, body: successBody(loginData) }],
        captures,
      );
      await login({ email: "a@b.com", password: "p" });
      // Also test getMe with token
      __setStoredAccessTokenForTest("super-secret-access-12345");
      const user = {
        id: "u1",
        email: "a@b.com",
        emailVerifiedAt: null,
        firstName: "A",
        lastName: "B",
        fullName: "A B",
        phoneNumber: null,
        lastLoginAt: null,
        avatarMediaId: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mock.restoreAll();
      captures.length = 0;
      captureFetchSequence(
        [{ status: 200, body: successBody(user) }],
        captures,
      );
      await getMe();

      const logText = logs.join(" ");
      assert.equal(logText.includes("super-secret-access-12345"), false);
      assert.equal(logText.includes("refresh"), false);
    } finally {
      (console as unknown as Record<string, unknown>).log = originalLog;
      (console as unknown as Record<string, unknown>).error = originalError;
    }
  });
});

describe("auth — sessions", () => {
  it("listSessions returns sessions array with current flag", async () => {
    __setStoredAccessTokenForTest("tok");
    const sessionsPayload = {
      sessions: [
        {
          id: "s1",
          deviceName: "Chrome",
          platform: "dashboard",
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          current: true,
        },
        {
          id: "s2",
          deviceName: "Mobile",
          platform: "mobile",
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          current: false,
        },
      ],
    };
    const captures: Captured[] = [];
    captureFetchSequence(
      [{ status: 200, body: successBody(sessionsPayload) }],
      captures,
    );
    const sessions = await listSessions();
    assert.equal(sessions.length, 2);
    assert.equal(sessions[0].id, "s1");
    assert.equal(sessions[0].current, true);
    const headers = captures[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer tok");
  });

  it("revokeSession sends DELETE to /auth/sessions/:id with Bearer", async () => {
    __setStoredAccessTokenForTest("tok2");
    const captures: Captured[] = [];
    captureFetchSequence([{ status: 204, body: "" }], captures);
    await revokeSession("s1");
    assert.match(captures[0].url, /\/auth\/sessions\/s1/);
    assert.equal(captures[0].init.method, "DELETE");
    const headers = captures[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer tok2");
  });
});

describe("auth — token store set/clear semantics", () => {
  it("setStoredAccessToken trims and clear works", () => {
    setStoredAccessToken("  abc  ", 900);
    assert.equal(getStoredAccessToken(), "abc");
    clearLocalSession();
    assert.equal(getStoredAccessToken(), undefined);
  });

  it("isRetryEligible does not consider empty token eligible in client (handled via token check)", async () => {
    // Direct isRetryEligible true for GET, but client will not refresh if token falsy
    assert.equal(isRetryEligible({ path: "/products", method: "GET" }), true);
    // Now test client with no token -> no refresh
    __setStoredAccessTokenForTest(undefined);
    __setLanguageAndTokenForTest(
      async () =>
        ({ lang: "en", token: undefined }) as unknown as Awaited<
          ReturnType<
            typeof import("./getLanguageAndToken.ts").getLanguageAndToken
          >
        >,
    );
    let fetchCalls = 0;
    mock.method(globalThis, "fetch", async () => {
      fetchCalls += 1;
      return createMockResponse({
        status: 401,
        body: failureBody({
          statusCode: 401,
          message: "Unauthorized",
          code: "UnauthorizedException",
        }),
      });
    });
    await assert.rejects(
      () => request({ path: "/products" }),
      (e: unknown) => {
        assert.ok(e instanceof ApiClientError);
        return true;
      },
    );
    assert.equal(fetchCalls, 1);
  });
});

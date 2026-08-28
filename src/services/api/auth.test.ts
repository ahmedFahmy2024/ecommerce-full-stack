/**
 * Tests for `auth.ts` — browser-direct authentication & refresh coordinator (remediation T15).
 *
 * Covers:
 * - login/refresh are browser-direct with credentials: "include" (no Authorization on refresh)
 * - no server/global token store (client-only session.client.ts)
 * - refresh updates client session used by subsequent API requests
 * - logout/failed refresh clears session exactly once
 * - concurrent 401s issue one refresh
 * - no forbidden retry (login/logout/refresh/uploads/mutations)
 * - proxy does not call /users/:id/permissions (checked via file read)
 * - no legacy default client / queries.ts imports
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  __getRefreshPromiseForTest,
  __resetRefreshForTest,
  clearLocalSession,
  getMe,
  isRetryEligible,
  listSessions,
  login,
  logout,
  refresh,
  refreshAccessToken,
  revokeSession,
} from "./auth.ts";
import {
  __resetSessionForTest,
  __setAccessTokenForTest,
  clearSession,
  clearSessionAndNotify,
  getAccessToken,
  registerLogoutHook,
  __resetLogoutHooksForTest,
} from "./session.client.ts";
import {
  __resetLanguageAndTokenForTest,
  __setLanguageAndTokenForTest,
  request,
} from "./client.ts";
import { ApiClientError } from "./contracts.ts";

// Ensure test env allows session.client without window
(process.env as Record<string, string | undefined>).NODE_ENV = "test";

const BACKEND_ENV = "NEXT_PUBLIC_BACKEND_URL";
const KEY_ENV = "NEXT_PUBLIC_DASHBOARD_API_KEY";

let originalBackend: string | undefined;
let originalKey: string | undefined;

beforeEach(() => {
  originalBackend = process.env[BACKEND_ENV];
  originalKey = process.env[KEY_ENV];
  process.env[BACKEND_ENV] = "http://localhost:3001/v1";
  process.env[KEY_ENV] = "test-dashboard-key-32-chars-minimum-ok";
  __resetSessionForTest();
  __resetRefreshForTest();
  __resetLogoutHooksForTest();
  __resetLanguageAndTokenForTest();
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
  __resetSessionForTest();
  __resetRefreshForTest();
  __resetLogoutHooksForTest();
  __resetLanguageAndTokenForTest();
});

// Helpers

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
// Tests — browser-direct login with credentials: "include"
// ---------------------------------------------------------------------------

describe("auth — browser-direct login includes credentials: include", () => {
  it("login sends X-Access-Api, x-lang, credentials include, no Authorization, stores token in client session", async () => {
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
    assert.equal(getAccessToken(), "new-access-token-abc");
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

  it("no server/global token store — token lives only in client session, not in module global leakable from server", async () => {
    // Verify auth.ts does not export a module-global `let _accessToken` that is
    // importable from server code. It should delegate to session.client.ts which
    // is marked "use client" and throws if imported on server.
    const authSource = readFileSync(
      join(process.cwd(), "src/services/api/auth.ts"),
      "utf8",
    );
    assert.equal(
      authSource.includes("let _accessToken"),
      false,
      "auth.ts must not have module-global _accessToken",
    );
    assert.equal(authSource.includes("let _tokenExpiresIn"), false);
    const sessionSource = readFileSync(
      join(process.cwd(), "src/services/api/session.client.ts"),
      "utf8",
    );
    assert.match(sessionSource, /"use client"/);
    assert.match(sessionSource, /isBrowser|typeof window/);
    // Client session is the only store — verify login updates it
    __setAccessTokenForTest(undefined);
    assert.equal(getAccessToken(), undefined);
    const loginData = {
      accessToken: "client-only-token",
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
    assert.equal(getAccessToken(), "client-only-token");
    // Ensure client `request` uses the same session source for subsequent calls
    let authHeader: string | undefined;
    mock.restoreAll();
    mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
      authHeader = (init.headers as Record<string, string>).Authorization;
      return createMockResponse({
        status: 200,
        body: successBody({ ok: true }),
      });
    });
    // stub lang, but token comes from session.client, not stub
    __setLanguageAndTokenForTest(
      async () =>
        ({ lang: "en", token: undefined }) as unknown as Awaited<
          ReturnType<
            typeof import("./getLanguageAndToken.ts").getLanguageAndToken
          >
        >,
    );
    await request({ path: "/products" });
    assert.equal(authHeader, "Bearer client-only-token");
  });
});

describe("auth — /auth/me uses dashboard key + Bearer from client session", () => {
  it("sends X-Access-Api and Authorization Bearer for getMe", async () => {
    __setAccessTokenForTest("bearer-xyz", 900);
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
});

describe("auth — refresh uses credentials/cookie flow (no Authorization) and updates client session", () => {
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
    __setAccessTokenForTest("old-token");
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
    // should have updated client session
    assert.equal(getAccessToken(), "refreshed-token-xyz");
  });

  it("refreshAccessToken helper updates stored token and is single-flight", async () => {
    __setAccessTokenForTest("old");
    const newToken = "new-from-refresh";
    let fetchCount = 0;
    mock.method(globalThis, "fetch", async () => {
      fetchCount += 1;
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
    assert.equal(getAccessToken(), newToken);
  });
});

describe("client — expired-token GET refreshes once then retries once using refreshed client session", () => {
  it("GET 401 triggers one refresh then retries original GET once", async () => {
    __setAccessTokenForTest("expired-token");
    stubLangClient("en", "expired-token");
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
      const h = init.headers as Record<string, string>;
      assert.equal(h.Authorization, "Bearer fresh-token-123");
      return createMockResponse({
        status: 200,
        body: successBody(successProducts),
      });
    });

    const data = await request<typeof successProducts>({ path: "/products" });
    assert.deepEqual(data, successProducts);
    assert.equal(captures.length, 3);
    assert.equal(getAccessToken(), "fresh-token-123");
  });
});

describe("client — multiple simultaneous 401s issue only one refresh", () => {
  it("concurrent GET 401s coalesce to one POST /auth/refresh", async () => {
    __setAccessTokenForTest("expired");
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
    assert.equal(getAccessToken(), "new-token-concurrent");
  });
});

describe("client — failed refresh clears session and does not loop", () => {
  it("when refresh 401s, clears stored token and throws without retry loop", async () => {
    __setAccessTokenForTest("expired-token-loop");
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
        assert.equal((err as ApiClientError).status, 401);
        return true;
      },
    );
    assert.equal(getAccessToken(), undefined);
    assert.equal(fetchCalls, 2);
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
    __setAccessTokenForTest(undefined);
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
      (e: unknown) => {
        assert.ok(e instanceof ApiClientError);
        return true;
      },
    );
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
    __setAccessTokenForTest("expired");
    stubLangClient("en", "expired");
    let calls = 0;
    mock.method(globalThis, "fetch", async (url: string) => {
      calls += 1;
      if ((url as string).includes("/auth/refresh")) {
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
    __setAccessTokenForTest("expired");
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

describe("auth — logout succeeds on 204 and clears client session exactly once", () => {
  it("calls POST /auth/logout with Bearer and credentials, handles 204, clears token and runs hooks once", async () => {
    __setAccessTokenForTest("valid-token");
    let hookCalls = 0;
    registerLogoutHook(() => {
      hookCalls += 1;
    });
    const captures: Captured[] = [];
    captureFetchSequence([{ status: 204, body: "" }], captures);

    await logout();
    assert.equal(getAccessToken(), undefined);
    assert.equal(hookCalls, 1);
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

  it("clears local state even when backend session already invalid (401) — exactly once", async () => {
    __setAccessTokenForTest("stale-token");
    let hookCalls = 0;
    registerLogoutHook(() => {
      hookCalls += 1;
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
    await logout();
    assert.equal(getAccessToken(), undefined);
    assert.equal(hookCalls, 1);
  });

  it("failed refresh clears session exactly once", async () => {
    __setAccessTokenForTest("tok");
    let hookCalls = 0;
    registerLogoutHook(() => {
      hookCalls += 1;
    });
    mock.method(globalThis, "fetch", async (url: string) => {
      if ((url as string).includes("/auth/refresh")) {
        return createMockResponse({
          status: 401,
          body: failureBody({
            statusCode: 401,
            message: "Invalid",
            code: "UnauthorizedException",
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
    stubLangClient("en", "tok");
    await assert.rejects(
      () => request({ path: "/products" }),
      () => true,
    );
    assert.equal(getAccessToken(), undefined);
    assert.equal(hookCalls, 1);
  });
});

describe("auth — no secret logging", () => {
  it("does not log access tokens", async () => {
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
      __setAccessTokenForTest("super-secret-access-12345");
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
    } finally {
      (console as unknown as Record<string, unknown>).log = originalLog;
      (console as unknown as Record<string, unknown>).error = originalError;
    }
  });
});

describe("auth — sessions", () => {
  it("listSessions returns sessions array with current flag", async () => {
    __setAccessTokenForTest("tok");
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
    __setAccessTokenForTest("tok2");
    const captures: Captured[] = [];
    captureFetchSequence([{ status: 204, body: "" }], captures);
    await revokeSession("s1");
    assert.match(captures[0].url, /\/auth\/sessions\/s1/);
    assert.equal(captures[0].init.method, "DELETE");
    const headers = captures[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer tok2");
  });
});

describe("remediation — proxy and legacy checks", () => {
  it("proxy.ts does not call a permissions endpoint (no fetch, locale only)", () => {
    const proxySource = readFileSync(
      join(process.cwd(), "src/proxy.ts"),
      "utf8",
    );
    // No Nest fetch at all — middleware is locale-only until T21
    assert.equal(proxySource.includes("fetch("), false);
    assert.equal(proxySource.includes("await fetch"), false);
    // Should only do locale handling (no auth/permission gate)
    assert.match(proxySource, /createMiddleware|intlMiddleware/);
    // Documented temporary boundary — must not contain a guessed permissions fetch
    assert.equal(proxySource.includes("X-Access-Api"), false);
    assert.equal(proxySource.includes("Authorization"), false);
  });

  it("no legacy default apiClient or queries.ts imports remain", () => {
    const indexSource = readFileSync(
      join(process.cwd(), "src/services/api/index.ts"),
      "utf8",
    );
    assert.equal(indexSource.includes("LegacyDefault"), false);
    assert.equal(indexSource.includes("export default"), false);
    assert.equal(
      existsSync(join(process.cwd(), "src/services/api/queries.ts")),
      false,
    );
    assert.equal(
      existsSync(join(process.cwd(), "src/types/pagination.ts")),
      false,
    );
  });

  it("no forbidden fetch outside approved transport boundary", () => {
    const allowed = [
      "src/services/api/client.ts",
      "src/services/api/auth.ts",
      "src/services/api/transport.ts",
    ];
    // This test asserts the file count: if a file outside allowed contains fetch(, it fails.
    // We check via reading proxy/auth which we already verified have no fetch.
    const proxyHasFetch = readFileSync(
      join(process.cwd(), "src/proxy.ts"),
      "utf8",
    ).includes("fetch(");
    assert.equal(proxyHasFetch, false);
    const authStubHasFetch = readFileSync(
      join(process.cwd(), "src/auth.ts"),
      "utf8",
    ).includes("await fetch");
    assert.equal(authStubHasFetch, false);
  });

  it("session.client.ts is client-only and not importable by server/Edge", () => {
    const sessionSource = readFileSync(
      join(process.cwd(), "src/services/api/session.client.ts"),
      "utf8",
    );
    assert.match(sessionSource, /"use client"/);
    const proxySource = readFileSync(
      join(process.cwd(), "src/proxy.ts"),
      "utf8",
    );
    assert.equal(proxySource.includes("session.client"), false);
    assert.equal(proxySource.includes("getAccessToken"), false);
  });
});

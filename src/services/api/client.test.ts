/**
 * Tests for `client.ts` — generic transport client (T14).
 *
 * Runner: Node.js built-in `node:test`
 * Run:  node --experimental-strip-types --test src/services/api/client.test.ts
 * Or:   pnpm test
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

import {
  __resetLanguageAndTokenForTest,
  __setLanguageAndTokenForTest,
  apiClient,
  request,
} from "./client.ts";
import { ApiClientError } from "./contracts.ts";
import { __resetSessionForTest } from "./session.client.ts";

// ---------------------------------------------------------------------------
// Env setup — validated config requires these
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
  (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  __resetSessionForTest();
});

afterEach(() => {
  const env = process.env as Record<string, string | undefined>;
  if (originalBackend === undefined) delete env[BACKEND_ENV];
  else env[BACKEND_ENV] = originalBackend;
  if (originalKey === undefined) delete env[KEY_ENV];
  else env[KEY_ENV] = originalKey;
  mock.restoreAll();
  __resetLanguageAndTokenForTest();
  __resetSessionForTest();
});

// ---------------------------------------------------------------------------
// Fetch mock helpers — Response-like for parseApiResponse
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
  path?: string;
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
    meta: {
      timestamp: new Date().toISOString(),
      path: overrides.path ?? "/test",
    },
  });
}

type FetchCapture = { url: string; init: RequestInit };

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

// Helper to stub fetch and capture args
function stubFetch(response: Response, capture?: FetchCapture) {
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (capture) {
      capture.url = url as string;
      capture.init = init;
    }
    return response;
  });
}

function stubFetchThrow(error: unknown, capture?: FetchCapture) {
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (capture) {
      capture.url = url as string;
      capture.init = init;
    }
    throw error;
  });
}

function stubLang(lang: string, token?: string) {
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

describe("client — default headers and credentials", () => {
  it("sends exact default headers, credentials include, x-lang en, without Authorization when no token", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({ ok: true }) }),
      capture,
    );

    const data = await request<{ ok: boolean }>({ path: "/products" });
    assert.deepEqual(data, { ok: true });
    assert.equal(capture.init.credentials, "include");
    const headers = capture.init.headers as Record<string, string>;
    assert.equal(headers.Accept, "application/json");
    assert.equal(
      headers["X-Access-Api"],
      "test-dashboard-key-32-chars-minimum-ok",
    );
    assert.equal(headers["x-lang"], "en");
    assert.equal(headers.Authorization, undefined);
    assert.equal("lang" in headers, false);
  });

  it("sends Authorization Bearer when token exists and x-lang ar", async () => {
    stubLang("ar", "tok123");
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({ ok: true }) }),
      capture,
    );

    await request({ path: "/orders" });
    const headers = capture.init.headers as Record<string, string>;
    assert.equal(headers["x-lang"], "ar");
    assert.equal(headers.Authorization, "Bearer tok123");
    assert.equal(headers.Accept, "application/json");
    assert.equal(
      headers["X-Access-Api"],
      "test-dashboard-key-32-chars-minimum-ok",
    );
  });

  it("apiClient.request alias works", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({ id: 1 }) }),
      capture,
    );
    const data = await apiClient.request<{ id: number }>({ path: "/test" });
    assert.deepEqual(data, { id: 1 });
    assert.equal(capture.init.credentials, "include");
  });

  it("falls back to en when lang is unsupported", async () => {
    // stub returns "fr" — client normalizes to en
    stubLang("fr" as unknown as string, undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({}) }),
      capture,
    );
    await request({ path: "/test" });
    assert.equal(
      (capture.init.headers as Record<string, string>)["x-lang"],
      "en",
    );
  });
});

describe("client — body handling", () => {
  it("JSON body: sets Content-Type json and stringifies once", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({ created: true }) }),
      capture,
    );

    const body = { email: "a@b.com", password: "secret" };
    await request({ method: "POST", path: "/auth/login", body });
    const headers = capture.init.headers as Record<string, string>;
    assert.equal(headers["Content-Type"], "application/json");
    assert.equal(capture.init.body, JSON.stringify(body));
    assert.equal(capture.init.method, "POST");
  });

  it("FormData: does not set Content-Type and preserves instance", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({}) }),
      capture,
    );
    const fd = new FormData();
    fd.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");
    fd.append("name", "test");

    await request({
      method: "POST",
      path: "/media",
      body: fd as unknown as Record<string, unknown>,
    });
    const headers = capture.init.headers as Record<string, string>;
    assert.equal(headers["Content-Type"], undefined);
    assert.equal(headers["content-type"], undefined);
    assert.ok(capture.init.body instanceof FormData);
  });

  it("Blob: does not set application/json and preserves blob", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({}) }),
      capture,
    );
    const blob = new Blob(["binary"], { type: "image/png" });
    await request({
      method: "POST",
      path: "/media",
      body: blob as unknown as Record<string, unknown>,
    });
    const headers = capture.init.headers as Record<string, string>;
    assert.equal(headers["Content-Type"] !== "application/json", true);
    assert.ok(capture.init.body instanceof Blob);
  });

  it("GET must not send body even if body is provided", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({ list: [] }) }),
      capture,
    );

    await request({
      method: "GET",
      path: "/products",
      body: { should: "be ignored" } as unknown as Record<string, unknown>,
    });
    assert.equal(capture.init.body, undefined);
    assert.equal(capture.init.method, "GET");
  });

  it("supports PUT, PATCH, DELETE methods", async () => {
    for (const method of ["PUT", "PATCH", "DELETE"] as const) {
      mock.restoreAll();
      __resetLanguageAndTokenForTest();
      stubLang("en", undefined);
      const capture: FetchCapture = { url: "", init: {} as RequestInit };
      stubFetch(
        createMockResponse({ status: 200, body: successBody({ ok: true }) }),
        capture,
      );
      await request({ method, path: "/products/1", body: { name: "x" } });
      assert.equal(capture.init.method, method);
    }
  });
});

describe("client — URL encoding and query", () => {
  it("encodes dynamic path params via encodeURIComponent", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({}) }),
      capture,
    );

    await request({
      path: "/products/{id}",
      params: { id: "hello world & more" },
    });
    // buildApiUrl will encode segments, so we check url contains encoded value
    assert.match(capture.url, /hello%20world%20%26%20more/);
    assert.equal(capture.url.includes("hello world"), false);
  });

  it("encodes path segment with slash correctly", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({}) }),
      capture,
    );
    await request({ path: "/categories/slug/{slug}", params: { slug: "a/b" } });
    assert.match(capture.url, /a%2Fb/);
  });

  it("builds URL via buildApiUrl with query: arrays as repeated keys, omit empty, retain false/0", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({}) }),
      capture,
    );

    await request({
      path: "/products",
      query: {
        status: ["pending", "paid"],
        page: 0,
        active: false,
        empty: "",
        nil: null as unknown as string,
        undef: undefined as unknown as string,
        q: "a/b & c+d",
      },
    });
    const url = new URL(capture.url);
    assert.deepEqual(url.searchParams.getAll("status"), ["pending", "paid"]);
    assert.equal(url.searchParams.get("page"), "0");
    assert.equal(url.searchParams.get("active"), "false");
    assert.equal(url.searchParams.has("empty"), false);
    assert.equal(url.searchParams.has("nil"), false);
    assert.equal(url.searchParams.has("undef"), false);
    assert.equal(url.searchParams.get("q"), "a/b & c+d");
  });

  it("uses buildApiUrl exclusively — URL starts with validated base", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({}) }),
      capture,
    );
    await request({ path: "/users" });
    assert.equal(
      capture.url.startsWith("http://localhost:3001/v1/users"),
      true,
    );
  });
});

describe("client — AbortSignal forwarding", () => {
  it("forwards AbortSignal to fetch", async () => {
    stubLang("en", undefined);
    const capture: FetchCapture = { url: "", init: {} as RequestInit };
    stubFetch(
      createMockResponse({ status: 200, body: successBody({}) }),
      capture,
    );
    const controller = new AbortController();
    await request({ path: "/products", signal: controller.signal });
    assert.equal(capture.init.signal, controller.signal);
  });

  it("aborted fetch throws normalized ABORTED error", async () => {
    stubLang("en", undefined);
    const abortErr = new DOMException("Aborted", "AbortError");
    stubFetchThrow(abortErr);
    await assert.rejects(
      () => request({ path: "/products" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal((err as ApiClientError).code, "ABORTED");
        assert.equal((err as ApiClientError).status, 0);
        return true;
      },
    );
  });
});

describe("client — response handling", () => {
  it("returns typed success envelope data", async () => {
    stubLang("en", undefined);
    stubFetch(
      createMockResponse({
        status: 200,
        body: successBody({ id: "123", name: "Test" }),
      }),
    );
    const data = await request<{ id: string; name: string }>({
      path: "/products/123",
    });
    assert.deepEqual(data, { id: "123", name: "Test" });
  });

  it("supports paginated response shape inside ApiSuccess", async () => {
    stubLang("en", undefined);
    const paginated = {
      products: [{ id: "1" }, { id: "2" }],
      pagination: { total: 2, page: 1, limit: 10, pages: 1 },
    };
    stubFetch(
      createMockResponse({ status: 200, body: successBody(paginated) }),
    );
    const data = await request<typeof paginated>({
      path: "/products",
      query: { page: 1 },
    });
    assert.deepEqual(data, paginated);
    assert.equal((data as typeof paginated).pagination.pages, 1);
  });

  it("returns undefined for 204", async () => {
    stubLang("en", undefined);
    stubFetch(createMockResponse({ status: 204, body: "" }));
    const data = await request({ method: "DELETE", path: "/media/1" });
    assert.equal(data, undefined);
  });

  it("returns undefined for 200 empty body", async () => {
    stubLang("en", undefined);
    stubFetch(createMockResponse({ status: 200, body: "   " }));
    const data = await request({ path: "/test" });
    assert.equal(data, undefined);
  });
});

describe("client — normalized errors", () => {
  it("throws ApiClientError for 400 validation array with details", async () => {
    stubLang("en", undefined);
    const arr = ["email is required", "password is too short"];
    stubFetch(
      createMockResponse({
        status: 400,
        body: failureBody({
          statusCode: 400,
          message: arr,
          code: "ValidationException",
        }),
      }),
    );
    await assert.rejects(
      () => request({ method: "POST", path: "/auth/register" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        const e = err as ApiClientError;
        assert.equal(e.status, 400);
        assert.equal(e.code, "ValidationException");
        assert.equal(e.message, arr.join("\n"));
        assert.deepEqual(e.details, arr);
        return true;
      },
    );
  });

  it("throws for 401, 403, 404, 409 with structured details, 422, 429, 500", async () => {
    const cases: Array<{ status: number; code: string }> = [
      { status: 401, code: "UnauthorizedException" },
      { status: 403, code: "ForbiddenException" },
      { status: 404, code: "NotFoundException" },
      { status: 422, code: "ValidationException" },
      { status: 429, code: "ThrottlerException" },
      { status: 500, code: "InternalServerError" },
    ];
    for (const c of cases) {
      mock.restoreAll();
      __resetLanguageAndTokenForTest();
      stubLang("en", undefined);
      stubFetch(
        createMockResponse({
          status: c.status,
          body: failureBody({
            statusCode: c.status,
            message: "error",
            code: c.code,
          }),
        }),
      );
      await assert.rejects(
        () => request({ path: "/test" }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.equal((err as ApiClientError).status, c.status);
          assert.equal((err as ApiClientError).code, c.code);
          return true;
        },
      );
    }
    // 409 structured details
    mock.restoreAll();
    __resetLanguageAndTokenForTest();
    stubLang("en", undefined);
    const details = { items: [{ productId: "p1", reason: "PRICE_CHANGED" }] };
    stubFetch(
      createMockResponse({
        status: 409,
        body: failureBody({
          statusCode: 409,
          message: "Price changed",
          code: "ConflictException",
          details,
        }),
      }),
    );
    await assert.rejects(
      () => request({ method: "POST", path: "/orders" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.deepEqual((err as ApiClientError).details, details);
        assert.equal((err as ApiClientError).status, 409);
        return true;
      },
    );
  });

  it("non-JSON error returns generic fallback without leaking body", async () => {
    stubLang("en", undefined);
    stubFetch(
      createMockResponse({
        status: 500,
        headers: { "content-type": "text/html" },
        body: "<html>stack</html>",
      }),
    );
    await assert.rejects(
      () => request({ path: "/test" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal(
          (err as ApiClientError).message,
          "Something went wrong. Please try again.",
        );
        assert.equal((err as ApiClientError).message.includes("<html>"), false);
        return true;
      },
    );
  });

  it("network failure throws NETWORK_ERROR without leaking raw message", async () => {
    stubLang("en", undefined);
    stubFetchThrow(new TypeError("fetch failed"));
    await assert.rejects(
      () => request({ path: "/test" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal((err as ApiClientError).code, "NETWORK_ERROR");
        assert.equal((err as ApiClientError).status, 0);
        assert.equal(
          (err as ApiClientError).message.includes("fetch failed"),
          false,
        );
        return true;
      },
    );
  });

  it("malformed JSON on success returns MALFORMED_RESPONSE", async () => {
    stubLang("en", undefined);
    stubFetch(
      createMockResponse({
        status: 200,
        headers: { "content-type": "application/json" },
        body: "{ invalid",
      }),
    );
    await assert.rejects(
      () => request({ path: "/test" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal((err as ApiClientError).code, "MALFORMED_RESPONSE");
        return true;
      },
    );
  });
});

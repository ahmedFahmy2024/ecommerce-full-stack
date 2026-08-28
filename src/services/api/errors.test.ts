/**
 * Tests for `errors.ts` — response/error normalization (T13).
 *
 * Runner: Node.js built-in `node:test` (no external framework).
 * Run:  node --experimental-strip-types --test src/services/api/errors.test.ts
 * Or:   pnpm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiClientError } from "./contracts.ts";
import {
  codeForStatus,
  envelopeToApiClientError,
  isAbortError,
  normalizeMessage,
  normalizeTransportError,
  parseApiResponse,
  parseOrThrow,
} from "./errors.ts";

// ---------------------------------------------------------------------------
// Helpers — minimal Response mock that satisfies parseApiResponse
// ---------------------------------------------------------------------------

type MockHeaders = {
  get(name: string): string | null;
};

function mockHeaders(entries: Record<string, string> = {}): MockHeaders {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    lower[k.toLowerCase()] = v;
  }
  return {
    get(name: string) {
      return lower[name.toLowerCase()] ?? null;
    },
  };
}

type MockResponseInit = {
  status: number;
  ok?: boolean;
  headers?: Record<string, string>;
  body?: string;
  textThrows?: unknown;
};

function createMockResponse(init: MockResponseInit): Response {
  let textCallCount = 0;
  const { status, headers, body = "", textThrows } = init;
  const ok = init.ok ?? (status >= 200 && status < 300);

  const mock = {
    status,
    ok,
    headers: mockHeaders(headers),
    async text() {
      textCallCount += 1;
      if (textThrows !== undefined) throw textThrows;
      return body;
    },
    // Expose counter for single-consume assertion
    get _textCallCount() {
      return textCallCount;
    },
    // Needed to satisfy Response type — not used by parser but present
    json: async () => JSON.parse(body),
  } as unknown as Response & { _textCallCount: number };

  // Attach private helper for test assertions without breaking type
  (mock as unknown as Record<string, unknown>)._getCallCount = () =>
    textCallCount;

  return mock;
}

function getTextCallCount(response: Response): number {
  const r = response as unknown as Record<string, unknown>;
  const fn = r._getCallCount as (() => number) | undefined;
  return fn ? fn() : 0;
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

function successBody<T>(data: T): string {
  return JSON.stringify({
    success: true,
    data,
    meta: { timestamp: new Date().toISOString(), path: "/test" },
  });
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

describe("isAbortError", () => {
  it("detects DOMException AbortError by name", () => {
    const err = new DOMException("Aborted", "AbortError");
    assert.equal(isAbortError(err), true);
  });

  it("detects plain object with name AbortError", () => {
    assert.equal(isAbortError({ name: "AbortError" }), true);
  });

  it("returns false for generic errors", () => {
    assert.equal(isAbortError(new Error("boom")), false);
    assert.equal(isAbortError(null), false);
    assert.equal(isAbortError(undefined), false);
  });
});

describe("codeForStatus", () => {
  it("returns NETWORK_ERROR for 0", () => {
    assert.equal(codeForStatus(0), "NETWORK_ERROR");
  });
  it("returns HTTP_<status> for 4xx/5xx", () => {
    assert.equal(codeForStatus(404), "HTTP_404");
    assert.equal(codeForStatus(500), "HTTP_500");
  });
  it("returns UNKNOWN_ERROR for non-http success status", () => {
    assert.equal(codeForStatus(200), "UNKNOWN_ERROR");
  });
});

describe("normalizeMessage", () => {
  it("returns trimmed string message", () => {
    assert.equal(normalizeMessage("  hello  "), "hello");
  });
  it("joins string array with newline", () => {
    assert.equal(normalizeMessage(["a", "b", "c"]), "a\nb\nc");
  });
  it("filters empty strings in array", () => {
    assert.equal(normalizeMessage(["", "  ", "ok"]), "ok");
  });
  it("uses fallback for empty string", () => {
    assert.equal(
      normalizeMessage("   "),
      "Something went wrong. Please try again.",
    );
  });
  it("uses fallback for empty array", () => {
    assert.equal(
      normalizeMessage([]),
      "Something went wrong. Please try again.",
    );
  });
  it("uses fallback for non-string/non-array", () => {
    assert.equal(
      normalizeMessage(123),
      "Something went wrong. Please try again.",
    );
  });
});

describe("envelopeToApiClientError", () => {
  it("preserves string message and status/code", () => {
    const failure = {
      success: false as const,
      error: {
        statusCode: 401,
        message: "Unauthorized",
        code: "UnauthorizedException",
      },
      meta: { timestamp: new Date().toISOString(), path: "/auth/me" },
    };
    const err = envelopeToApiClientError(failure, "GET", "/auth/me");
    assert.equal(err.status, 401);
    assert.equal(err.code, "UnauthorizedException");
    assert.equal(err.message, "Unauthorized");
    assert.equal(err.path, "/auth/me");
    assert.equal(err.method, "GET");
    assert.equal(err.details, undefined);
  });

  it("joins string array message and preserves array in details when no explicit details", () => {
    const arr = ["email is required", "password is too short"];
    const failure = {
      success: false as const,
      error: { statusCode: 400, message: arr, code: "ValidationException" },
      meta: { timestamp: new Date().toISOString(), path: "/test" },
    };
    const err = envelopeToApiClientError(failure, "POST", "/users");
    assert.equal(err.message, "email is required\npassword is too short");
    assert.deepEqual(err.details, arr);
    assert.equal(err.status, 400);
    assert.equal(err.code, "ValidationException");
  });

  it("preserves structured details exactly (409 domain details)", () => {
    const details = {
      items: [
        { productId: "p1", reason: "PRICE_CHANGED", currentPrice: "12.00" },
      ],
    };
    const failure = {
      success: false as const,
      error: {
        statusCode: 409,
        message: "Price changed",
        code: "ConflictException",
        details,
      },
      meta: { timestamp: new Date().toISOString(), path: "/orders" },
    };
    const err = envelopeToApiClientError(failure, "POST", "/orders");
    assert.equal(err.status, 409);
    assert.deepEqual(err.details, details);
    // ensure same reference-ish deepEqual and not stringified
    assert.equal(typeof err.details, "object");
    assert.equal(err.message, "Price changed");
  });

  it("explicit details wins over message array", () => {
    const details = { custom: "structured" };
    // Use any to simulate explicit details with array message
    const rawFailure = {
      success: false as const,
      error: {
        statusCode: 422,
        message: ["a", "b"],
        code: "ValidationException",
        details,
      },
      meta: { timestamp: new Date().toISOString(), path: "/test" },
    };
    const err = envelopeToApiClientError(rawFailure, "POST", "/test");
    assert.deepEqual(err.details, details);
    assert.equal(err.message, "a\nb");
  });

  it("uses generic fallback for empty message", () => {
    const failure = {
      success: false as const,
      error: { statusCode: 500, message: "   ", code: "InternalServerError" },
      meta: { timestamp: new Date().toISOString(), path: "/test" },
    };
    const err = envelopeToApiClientError(failure, "GET", "/test");
    assert.equal(err.message, "Something went wrong. Please try again.");
  });
});

// ---------------------------------------------------------------------------
// parseApiResponse — core parsing tests
// ---------------------------------------------------------------------------

describe("parseApiResponse — success paths", () => {
  it("unwraps ApiSuccess envelope to data", async () => {
    const res = createMockResponse({
      status: 200,
      headers: { "content-type": "application/json" },
      body: successBody({ id: "123", name: "Test" }),
    });
    const result = await parseApiResponse<{ id: string; name: string }>(res, {
      method: "GET",
      path: "/products/123",
    });
    assert.equal(result.kind, "success");
    if (result.kind === "success") {
      assert.deepEqual(result.data, { id: "123", name: "Test" });
      assert.equal(result.status, 200);
    }
    assert.equal(getTextCallCount(res), 1);
  });

  it("returns empty for 204 without reading body more than allowed", async () => {
    const res = createMockResponse({ status: 204, body: "" });
    // Note: parseApiResponse short-circuits 204 before text(); still counts as 0
    const result = await parseApiResponse(res, {
      method: "DELETE",
      path: "/media/1",
    });
    assert.equal(result.kind, "empty");
    if (result.kind === "empty") assert.equal(result.status, 204);
  });

  it("returns empty for 2xx with empty body", async () => {
    const res = createMockResponse({ status: 200, headers: {}, body: "   " });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/test",
    });
    assert.equal(result.kind, "empty");
    assert.equal(getTextCallCount(res), 1);
  });

  it("consumes body only once on success", async () => {
    const res = createMockResponse({
      status: 200,
      headers: { "content-type": "application/json" },
      body: successBody({ ok: true }),
    });
    await parseApiResponse(res, { method: "GET", path: "/test" });
    assert.equal(getTextCallCount(res), 1);
  });
});

describe("parseApiResponse — ApiFailure envelopes per status", () => {
  it("validation-style message array (400)", async () => {
    const arr = ["email is required", "password must be longer"];
    const res = createMockResponse({
      status: 400,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 400,
        message: arr,
        code: "ValidationException",
      }),
    });
    const result = await parseApiResponse(res, {
      method: "POST",
      path: "/auth/register",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(result.error.status, 400);
      assert.equal(result.error.code, "ValidationException");
      assert.equal(result.error.message, arr.join("\n"));
      assert.deepEqual(result.error.details, arr);
    }
    assert.equal(getTextCallCount(res), 1);
  });

  it("401 Unauthorized", async () => {
    const res = createMockResponse({
      status: 401,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 401,
        message: "Unauthorized",
        code: "UnauthorizedException",
      }),
    });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/auth/me",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(result.error.status, 401);
      assert.equal(result.error.code, "UnauthorizedException");
      assert.equal(result.error.message, "Unauthorized");
    }
  });

  it("403 Forbidden", async () => {
    const res = createMockResponse({
      status: 403,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 403,
        message: "Forbidden",
        code: "ForbiddenException",
      }),
    });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/orders",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") assert.equal(result.error.status, 403);
  });

  it("404 Not Found", async () => {
    const res = createMockResponse({
      status: 404,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 404,
        message: "Not found",
        code: "NotFoundException",
      }),
    });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/products/999",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") assert.equal(result.error.status, 404);
  });

  it("409 with structured details preserved exactly", async () => {
    const details = {
      priceChanged: [{ variantId: "v1", old: "10", current: "12" }],
    };
    const res = createMockResponse({
      status: 409,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 409,
        message: "Price changed",
        code: "ConflictException",
        details,
      }),
    });
    const result = await parseApiResponse(res, {
      method: "POST",
      path: "/orders",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(result.error.status, 409);
      assert.equal(result.error.code, "ConflictException");
      assert.deepEqual(result.error.details, details);
      // Ensure details not stringified
      assert.equal(typeof result.error.details, "object");
    }
  });

  it("422 Unprocessable (validation array) and 400", async () => {
    for (const status of [400, 422]) {
      const res = createMockResponse({
        status,
        headers: { "content-type": "application/json" },
        body: failureBody({
          statusCode: status,
          message: ["field error"],
          code: "ValidationException",
        }),
      });
      const result = await parseApiResponse(res, {
        method: "POST",
        path: "/test",
      });
      assert.equal(result.kind, "failure");
      if (result.kind === "failure") assert.equal(result.error.status, status);
    }
  });

  it("429 Too Many Requests", async () => {
    const res = createMockResponse({
      status: 429,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 429,
        message: "Too many requests",
        code: "ThrottlerException",
      }),
    });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/products",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(result.error.status, 429);
      assert.equal(result.error.message, "Too many requests");
    }
  });

  it("500 Internal Server Error — never exposes stack", async () => {
    const res = createMockResponse({
      status: 500,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 500,
        message: "Internal server error",
        code: "InternalServerError",
      }),
    });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/test",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(result.error.status, 500);
      assert.equal(result.error.message, "Internal server error");
      // Ensure stack not leaked in message or details
      assert.equal(result.error.message.includes("stack"), false);
      assert.equal(result.error.message.includes("at "), false);
    }
  });
});

describe("parseApiResponse — non-JSON / malformed / empty", () => {
  it("non-JSON HTTP error returns generic fallback without leaking body", async () => {
    const res = createMockResponse({
      status: 500,
      headers: { "content-type": "text/html" },
      body: "<html>Internal Server Error stack at foo.js:10</html>",
    });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/test",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(result.error.status, 500);
      assert.equal(
        result.error.message,
        "Something went wrong. Please try again.",
      );
      // Must not echo HTML/stack
      assert.equal(result.error.message.includes("<html>"), false);
      assert.equal(result.error.message.includes("stack"), false);
      assert.equal(result.error.code, "HTTP_500");
    }
    assert.equal(getTextCallCount(res), 1);
  });

  it("malformed JSON on error status returns generic fallback", async () => {
    const res = createMockResponse({
      status: 500,
      headers: { "content-type": "application/json" },
      body: "{ invalid json",
    });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/test",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(result.error.status, 500);
      assert.equal(
        result.error.message,
        "Something went wrong. Please try again.",
      );
    }
    assert.equal(getTextCallCount(res), 1);
  });

  it("malformed JSON on success status returns MALFORMED_RESPONSE code", async () => {
    const res = createMockResponse({
      status: 200,
      headers: { "content-type": "application/json" },
      body: "{ invalid json",
    });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/test",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(result.error.code, "MALFORMED_RESPONSE");
      assert.equal(
        result.error.message,
        "Something went wrong. Please try again.",
      );
    }
  });

  it("empty error body returns generic fallback", async () => {
    const res = createMockResponse({
      status: 400,
      headers: { "content-type": "application/json" },
      body: "   ",
    });
    const result = await parseApiResponse(res, {
      method: "POST",
      path: "/test",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(result.error.status, 400);
      assert.equal(
        result.error.message,
        "Something went wrong. Please try again.",
      );
    }
  });

  it("empty object message array uses fallback", async () => {
    const res = createMockResponse({
      status: 400,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 400,
        message: [] as unknown as string,
        code: "ValidationException",
      }),
    });
    const result = await parseApiResponse(res, {
      method: "POST",
      path: "/test",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(
        result.error.message,
        "Something went wrong. Please try again.",
      );
    }
  });

  it("body read throws → failure with generic fallback and cause", async () => {
    const cause = new Error("read failed");
    const res = createMockResponse({
      status: 200,
      headers: { "content-type": "application/json" },
      body: "{}",
      textThrows: cause,
    });
    const result = await parseApiResponse(res, {
      method: "GET",
      path: "/test",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.equal(
        result.error.message,
        "Something went wrong. Please try again.",
      );
      assert.equal(
        (result.error as unknown as Record<string, unknown>).cause,
        cause,
      );
    }
  });
});

describe("normalizeTransportError", () => {
  it("maps AbortError to ABORTED with status 0", () => {
    const abort = new DOMException("Aborted", "AbortError");
    const err = normalizeTransportError(abort, "GET", "/products");
    assert.ok(err instanceof ApiClientError);
    assert.equal(err.code, "ABORTED");
    assert.equal(err.status, 0);
    assert.equal(err.message, "Request was cancelled.");
    assert.equal(err.path, "/products");
    assert.equal(err.method, "GET");
  });

  it("maps generic error to NETWORK_ERROR with safe message", () => {
    const networkErr = new TypeError("fetch failed");
    const err = normalizeTransportError(networkErr, "POST", "/auth/login");
    assert.equal(err.code, "NETWORK_ERROR");
    assert.equal(err.status, 0);
    assert.equal(
      err.message,
      "Network error. Please check your connection and try again.",
    );
    // Must not leak raw fetch message
    assert.equal(err.message.includes("fetch failed"), false);
  });

  it("maps unknown throw to NETWORK_ERROR", () => {
    const err = normalizeTransportError("string throw", "GET", "/test");
    assert.equal(err.code, "NETWORK_ERROR");
    assert.equal(err.status, 0);
  });

  it("preserves cause but never exposes stack in message", () => {
    const raw = new Error("secret stack at /internal/db.ts:123");
    (raw as unknown as Record<string, unknown>).stack =
      "Error: secret\n at db.ts:123";
    const err = normalizeTransportError(raw, "GET", "/test");
    assert.equal(err.message.includes("secret"), false);
    assert.equal(err.message.includes("stack"), false);
  });
});

describe("parseOrThrow", () => {
  it("throws ApiClientError on failure envelope", async () => {
    const res = createMockResponse({
      status: 404,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 404,
        message: "Not found",
        code: "NotFoundException",
      }),
    });
    await assert.rejects(
      () => parseOrThrow(res, { method: "GET", path: "/test" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal((err as ApiClientError).status, 404);
        return true;
      },
    );
  });

  it("returns undefined for empty", async () => {
    const res = createMockResponse({ status: 204, body: "" });
    const data = await parseOrThrow(res, {
      method: "DELETE",
      path: "/media/1",
    });
    assert.equal(data, undefined);
  });

  it("returns unwrapped data for success", async () => {
    const res = createMockResponse({
      status: 200,
      headers: { "content-type": "application/json" },
      body: successBody({ hello: "world" }),
    });
    const data = await parseOrThrow<{ hello: string }>(res, {
      method: "GET",
      path: "/test",
    });
    assert.deepEqual(data, { hello: "world" });
  });
});

describe("error details preservation", () => {
  it("preserves number details exactly (no stringify)", async () => {
    const details = 42;
    const res = createMockResponse({
      status: 409,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 409,
        message: "conflict",
        code: "ConflictException",
        details,
      }),
    });
    const result = await parseApiResponse(res, {
      method: "POST",
      path: "/test",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      // Our envelopeToApiClientError preserves details verbatim — but filter only
      // creates details for object/array, so numeric details path is defensive
      // In our test we force numeric details to verify preservation
      assert.equal(result.error.details, 42);
    }
  });

  it("does not stringify object details", async () => {
    const details = { a: { nested: true }, b: [1, 2, 3] };
    const res = createMockResponse({
      status: 409,
      headers: { "content-type": "application/json" },
      body: failureBody({
        statusCode: 409,
        message: "conflict",
        code: "ConflictException",
        details,
      }),
    });
    const result = await parseApiResponse(res, {
      method: "POST",
      path: "/test",
    });
    assert.equal(result.kind, "failure");
    if (result.kind === "failure") {
      assert.deepEqual(result.error.details, details);
      assert.equal(typeof result.error.details, "object");
    }
  });
});

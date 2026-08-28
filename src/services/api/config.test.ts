/**
 * Unit tests for `config.ts` — validated API configuration and URL builder (T12).
 *
 * Test runner: Node.js built-in `node:test` (Node 20+ / 24).
 * No external framework is added. Run with:
 *   node --experimental-strip-types --test src/services/api/config.test.ts
 * or via pnpm:
 *   pnpm test
 *
 * Decision note (T12): the project had no test runner configured
 * (see `dashboard/package.json` scripts). To keep the change minimal and avoid
 * introducing a large framework without review, this module uses the native
 * Node test runner + `node:assert/strict`. If the team later adopts Vitest/Jest,
 * these cases can be migrated one-to-one (they use standard `describe`/`it`
 * from `node:test` which Vitest also supports in compatibility mode).
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  buildApiUrl,
  buildUrl,
  getBackendUrl,
  getDashboardApiKey,
} from "./config.ts";

// ---------------------------------------------------------------------------
// Env helpers — mutate process.env per test, restore after
// ---------------------------------------------------------------------------

const BACKEND_ENV = "NEXT_PUBLIC_BACKEND_URL";
const KEY_ENV = "NEXT_PUBLIC_DASHBOARD_API_KEY";

let originalBackend: string | undefined;
let originalKey: string | undefined;
let originalNodeEnv: string | undefined;

beforeEach(() => {
  originalBackend = process.env[BACKEND_ENV];
  originalKey = process.env[KEY_ENV];
  originalNodeEnv = process.env.NODE_ENV;
  // Ensure deterministic base for most tests
  process.env[BACKEND_ENV] = "http://localhost:3001/v1";
  process.env[KEY_ENV] = "test-dashboard-key-32-chars-minimum-ok";
});

afterEach(() => {
  const env = process.env as Record<string, string | undefined>;
  if (originalBackend === undefined) delete env[BACKEND_ENV];
  else env[BACKEND_ENV] = originalBackend;
  if (originalKey === undefined) delete env[KEY_ENV];
  else env[KEY_ENV] = originalKey;
  if (originalNodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = originalNodeEnv;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getBackendUrl", () => {
  it("normalizes trailing slash: http://localhost:3001/v1/ -> http://localhost:3001/v1", () => {
    process.env[BACKEND_ENV] = "http://localhost:3001/v1/";
    assert.equal(getBackendUrl(), "http://localhost:3001/v1");
  });

  it("removes multiple trailing slashes", () => {
    process.env[BACKEND_ENV] = "http://localhost:3001/v1///";
    assert.equal(getBackendUrl(), "http://localhost:3001/v1");
  });

  it("preserves /v1 base path and trims whitespace", () => {
    process.env[BACKEND_ENV] = "  http://localhost:3001/v1  ";
    assert.equal(getBackendUrl(), "http://localhost:3001/v1");
  });

  it("throws actionable error when missing (does not reveal secrets)", () => {
    delete process.env[BACKEND_ENV];
    assert.throws(
      () => getBackendUrl(),
      (err: Error) => {
        assert.match(err.message, /NEXT_PUBLIC_BACKEND_URL/);
        assert.match(err.message, /\.env\.local/);
        // Must not contain the dashboard key value
        assert.equal(err.message.includes("M4yIZJAQ"), false);
        assert.equal(err.message.includes("test-dashboard-key"), false);
        return true;
      },
    );
  });

  it("throws when empty string", () => {
    process.env[BACKEND_ENV] = "   ";
    assert.throws(() => getBackendUrl(), /NEXT_PUBLIC_BACKEND_URL/);
  });

  it("rejects malformed URL", () => {
    process.env[BACKEND_ENV] = "not-a-url";
    assert.throws(() => getBackendUrl(), /Invalid NEXT_PUBLIC_BACKEND_URL/);
  });

  it("rejects non-http(s) URL (ftp)", () => {
    process.env[BACKEND_ENV] = "ftp://example.com/v1";
    assert.throws(() => getBackendUrl(), /Invalid NEXT_PUBLIC_BACKEND_URL/);
  });

  it("rejects protocol-relative or javascript: URLs", () => {
    process.env[BACKEND_ENV] = "javascript:alert(1)";
    assert.throws(() => getBackendUrl(), /Invalid NEXT_PUBLIC_BACKEND_URL/);
  });
});

describe("getDashboardApiKey", () => {
  it("returns trimmed key", () => {
    process.env[KEY_ENV] = "  my-key-123  ";
    assert.equal(getDashboardApiKey(), "my-key-123");
  });

  it("throws actionable error when missing and does not expose key value", () => {
    delete process.env[KEY_ENV];
    assert.throws(
      () => getDashboardApiKey(),
      (err: Error) => {
        assert.match(err.message, /NEXT_PUBLIC_DASHBOARD_API_KEY/);
        // Error must not echo any previous key value
        assert.equal(err.message.includes("my-key-123"), false);
        assert.equal(err.message.includes("M4yIZJAQ"), false);
        // No secret value should appear as substring of error
        return true;
      },
    );
  });

  it("throws when whitespace only", () => {
    process.env[KEY_ENV] = "   ";
    assert.throws(() => getDashboardApiKey(), /NEXT_PUBLIC_DASHBOARD_API_KEY/);
  });
});

describe("buildApiUrl", () => {
  it("joins base and resource path (normal joining)", () => {
    process.env[BACKEND_ENV] = "http://localhost:3001/v1";
    assert.equal(buildApiUrl("/products"), "http://localhost:3001/v1/products");
  });

  it("adds leading slash when path omits it", () => {
    process.env[BACKEND_ENV] = "http://localhost:3001/v1";
    assert.equal(buildApiUrl("products"), "http://localhost:3001/v1/products");
  });

  it("joins with trailing-slash base correctly (no double slash)", () => {
    process.env[BACKEND_ENV] = "http://localhost:3001/v1/";
    assert.equal(buildApiUrl("/products"), "http://localhost:3001/v1/products");
  });

  it("encodes special characters in path segments", () => {
    process.env[BACKEND_ENV] = "http://localhost:3001/v1";
    const url = buildApiUrl("/categories/slug/hello world & more");
    // Path segment should be encoded: "hello world & more" -> "hello%20world%20%26%20more"
    assert.equal(
      url,
      "http://localhost:3001/v1/categories/slug/hello%20world%20%26%20more",
    );
  });

  it("encodes path parameters with slashes (segment encoding)", () => {
    // If a segment itself contains a slash, it must be encoded, not treated as separator
    const url = buildApiUrl("/products/a/b");
    // "a/b" split would produce two segments; to test real encoding, pass a segment value
    // Simulating caller building path with encoded segment: "/products/" + encode...
    // Here direct path encoding preserves slashes as separators — ensure plain join works
    assert.equal(url, "http://localhost:3001/v1/products/a/b");
    // Now test a segment containing slash encoded via manual segment:
    const encoded = encodeURIComponent("a/b");
    const url2 = buildApiUrl(`/products/${encoded}`);
    // Our builder decodes then re-encodes, so "a%2Fb" should stay "a%2Fb"
    assert.equal(url2, "http://localhost:3001/v1/products/a%2Fb");
  });

  it("encodes special characters in query values", () => {
    process.env[BACKEND_ENV] = "http://localhost:3001/v1";
    const url = buildApiUrl("/products", { q: "a/b & c+d" });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("q"), "a/b & c+d");
    // Wire format must be encoded (contains %2F, %26 etc or + for space — either ok)
    assert.match(url, /q=/);
    // Ensure raw unsafe characters are not present unencoded in the URL string
    // The space should be encoded as %20 or +, ampersand as %26
    assert.equal(url.includes(" & "), false);
  });

  it("supports arrays as repeated query parameters", () => {
    const url = buildApiUrl("/products", { status: ["pending", "paid"] });
    const parsed = new URL(url);
    assert.deepEqual(parsed.searchParams.getAll("status"), ["pending", "paid"]);
  });

  it("preserves 0 and false query values", () => {
    const url = buildApiUrl("/products", {
      page: 0,
      active: false,
      limit: 10,
    });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("page"), "0");
    assert.equal(parsed.searchParams.get("active"), "false");
    assert.equal(parsed.searchParams.get("limit"), "10");
  });

  it("omits undefined, null, and empty-string query values", () => {
    const url = buildApiUrl("/products", {
      a: undefined,
      b: null as unknown as string,
      c: "",
      d: "ok",
      e: 0,
    });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.has("a"), false);
    assert.equal(parsed.searchParams.has("b"), false);
    assert.equal(parsed.searchParams.has("c"), false);
    assert.equal(parsed.searchParams.get("d"), "ok");
    assert.equal(parsed.searchParams.get("e"), "0");
  });

  it("omits empty strings inside arrays, preserves false/0 inside arrays", () => {
    const url = buildApiUrl("/products", {
      tags: [
        "",
        "a",
        null as unknown as string,
        undefined as unknown as string,
        "b",
      ],
      nums: [0, 1],
      flags: [false, true],
    });
    const parsed = new URL(url);
    assert.deepEqual(parsed.searchParams.getAll("tags"), ["a", "b"]);
    assert.deepEqual(parsed.searchParams.getAll("nums"), ["0", "1"]);
    assert.deepEqual(parsed.searchParams.getAll("flags"), ["false", "true"]);
  });

  it("serializes Date values consistently via toISOString()", () => {
    const d = new Date("2026-01-02T03:04:05.000Z");
    const url = buildApiUrl("/orders", { since: d });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("since"), d.toISOString());
  });

  it("serializes Date values inside arrays", () => {
    const d1 = new Date("2026-01-01T00:00:00.000Z");
    const d2 = new Date("2026-01-02T00:00:00.000Z");
    const url = buildApiUrl("/orders", { dates: [d1, d2] });
    const parsed = new URL(url);
    assert.deepEqual(parsed.searchParams.getAll("dates"), [
      d1.toISOString(),
      d2.toISOString(),
    ]);
  });

  it("never manually concatenates unsafe query strings (uses URLSearchParams encoding)", () => {
    const url = buildApiUrl("/search", { q: "hello world", filter: "a=b&c=d" });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("q"), "hello world");
    assert.equal(parsed.searchParams.get("filter"), "a=b&c=d");
    // Raw url must not contain unencoded '&' inside value — the '&' separating params vs inside value
    // We verify round-trip decoding works
    assert.equal(
      parsed.searchParams.toString().includes("filter=a%3Db%26c%3Dd"),
      true,
    );
  });

  it("buildUrl alias is identical to buildApiUrl", () => {
    const a = buildApiUrl("/products", { page: 1 });
    const b = buildUrl("/products", { page: 1 });
    assert.equal(a, b);
  });

  it("missing URL error does not reveal dashboard key", () => {
    delete process.env[BACKEND_ENV];
    process.env[KEY_ENV] = "super-secret-key-value-xyz";
    assert.throws(
      () => buildApiUrl("/products"),
      (err: Error) => {
        assert.equal(err.message.includes("super-secret-key-value-xyz"), false);
        return true;
      },
    );
  });

  it("malformed URL rejection does not reveal dashboard key", () => {
    process.env[BACKEND_ENV] = "http://[invalid";
    process.env[KEY_ENV] = "super-secret-key-value-xyz";
    assert.throws(
      () => buildApiUrl("/products"),
      (err: Error) => {
        assert.equal(err.message.includes("super-secret-key-value-xyz"), false);
        assert.match(err.message, /Invalid NEXT_PUBLIC_BACKEND_URL/);
        return true;
      },
    );
  });
});

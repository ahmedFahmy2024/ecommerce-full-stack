/**
 * Tests for `media.ts` — the media library resource service (T30).
 *
 * Covers request shapes against the verified backend contract
 * (nest-ecommerce/src/media/**):
 * - `GET /media` query params (page/limit/search/mimeType/sortBy/sortOrder)
 *   and success-envelope unwrap into `{ media, pagination }`
 * - `GET /media/purge-blocked` path + `{ media, total }` unwrap
 * - `POST /media` multipart: field name `file` (`UPLOAD_FIELD_NAME`), no
 *   manual `Content-Type` (browser must boundary it), optional altText/title
 * - `DELETE /media/:id` 204 → undefined, honest 404 on repeat delete
 * - `DELETE /media/:id/purge` 204 → undefined, 409 message/details preserved
 * - sortable-fields allow-list mirrors `QueryMediaDto.MEDIA_SORTABLE_FIELDS`
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import {
  __resetLanguageAndTokenForTest,
  __setLanguageAndTokenForTest,
} from "./client.ts";
import { ApiClientError } from "./contracts.ts";
import {
  deleteMedia,
  getPurgeBlocked,
  listMedia,
  MEDIA_PATHS,
  MEDIA_SORTABLE_FIELDS,
  purgeMedia,
  uploadMedia,
} from "./media.ts";
import {
  __resetSessionForTest,
  __setAccessTokenForTest,
} from "./session.client.ts";

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
  __resetLanguageAndTokenForTest();
});

// Helpers — same conventions as auth.test.ts / client.test.ts

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
    headers: {
      get: (name: string) => {
        const lower: Record<string, string> = {};
        for (const [k, v] of Object.entries(headers)) {
          lower[k.toLowerCase()] = v;
        }
        return lower[name.toLowerCase()] ?? null;
      },
    },
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
  responses: Array<{ status: number; body?: string }>,
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

function makeMediaRow(id: string): Record<string, unknown> {
  return {
    id,
    originalName: "pixel.png",
    mimeType: "image/png",
    sizeBytes: 8,
    width: 1,
    height: 1,
    altText: null,
    title: null,
    storageBackend: "local",
    url: "http://localhost:3001/media/media/2026/08/x.png",
    createdAt: "2026-08-29T00:00:00.000Z",
  };
}

// ---------------------------------------------------------------------------
// GET /media
// ---------------------------------------------------------------------------

describe("listMedia — request shape", () => {
  it("sends GET /media with all server filter params and transport headers", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [
        {
          status: 200,
          body: successBody({
            media: [makeMediaRow("m1")],
            pagination: { total: 1, page: 2, limit: 40, pages: 1 },
          }),
        },
      ],
      captures,
    );

    const result = await listMedia({
      page: 2,
      limit: 40,
      search: "pixel",
      mimeType: "image/png",
      sortBy: "originalName",
      sortOrder: "ASC",
    });

    const captured = captures[0];
    assert.equal(captured.init.method, "GET");
    const url = new URL(captured.url);
    assert.equal(url.origin + url.pathname, "http://localhost:3001/v1/media");
    assert.equal(url.searchParams.get("page"), "2");
    assert.equal(url.searchParams.get("limit"), "40");
    assert.equal(url.searchParams.get("search"), "pixel");
    assert.equal(url.searchParams.get("mimeType"), "image/png");
    assert.equal(url.searchParams.get("sortBy"), "originalName");
    assert.equal(url.searchParams.get("sortOrder"), "ASC");
    const headers = captured.init.headers as Record<string, string>;
    assert.equal(
      headers["X-Access-Api"],
      "test-dashboard-key-32-chars-minimum-ok",
    );
    assert.equal(headers["x-lang"], "en");
    assert.equal(headers.Accept, "application/json");
    assert.equal(captured.init.credentials, "include");

    // Envelope unwrap → `{ media, pagination }`
    assert.ok(result);
    assert.equal(result.media.length, 1);
    assert.equal(result.media[0]?.id, "m1");
    assert.deepEqual(result.pagination, {
      total: 1,
      page: 2,
      limit: 40,
      pages: 1,
    });
  });

  it("omits unset/empty params so backend defaults apply", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [
        {
          status: 200,
          body: successBody({
            media: [],
            pagination: { total: 0, page: 1, limit: 20, pages: 0 },
          }),
        },
      ],
      captures,
    );

    await listMedia({ page: 1 });

    const url = new URL(captures[0].url);
    assert.equal(url.searchParams.get("page"), "1");
    for (const key of ["search", "mimeType", "sortBy", "sortOrder", "limit"]) {
      assert.equal(url.searchParams.has(key), false, `unexpected param ${key}`);
    }
  });

  it("forwards the AbortSignal from useQuery", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [
        {
          status: 200,
          body: successBody({
            media: [],
            pagination: { total: 0, page: 1, limit: 20, pages: 0 },
          }),
        },
      ],
      captures,
    );
    const controller = new AbortController();
    await listMedia({}, { signal: controller.signal });
    assert.equal(captures[0].init.signal, controller.signal);
  });
});

// ---------------------------------------------------------------------------
// GET /media/purge-blocked
// ---------------------------------------------------------------------------

describe("getPurgeBlocked — request shape", () => {
  it("sends GET /media/purge-blocked and unwraps { media, total }", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [
        {
          status: 200,
          body: successBody({
            media: [makeMediaRow("m2")],
            total: 1,
          }),
        },
      ],
      captures,
    );

    const result = await getPurgeBlocked();

    const captured = captures[0];
    assert.equal(captured.init.method, "GET");
    assert.ok(captured.url.endsWith("/v1/media/purge-blocked"));
    assert.ok(result);
    assert.equal(result.total, 1);
    assert.equal(result.media[0]?.id, "m2");
  });

  it("forwards the AbortSignal", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [{ status: 200, body: successBody({ media: [], total: 0 }) }],
      captures,
    );
    const controller = new AbortController();
    await getPurgeBlocked({ signal: controller.signal });
    assert.equal(captures[0].init.signal, controller.signal);
  });
});

// ---------------------------------------------------------------------------
// POST /media (multipart upload)
// ---------------------------------------------------------------------------

describe("uploadMedia — multipart request shape", () => {
  it("posts FormData with field name 'file' and never sets Content-Type manually", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [{ status: 201, body: successBody(makeMediaRow("m3")) }],
      captures,
    );
    const file = new File([new Uint8Array([1, 2, 3])], "pixel.png", {
      type: "image/png",
    });

    const result = await uploadMedia(file, {
      altText: "a pixel",
      title: "Pixel",
    });

    const captured = captures[0];
    assert.equal(captured.init.method, "POST");
    const url = new URL(captured.url);
    assert.equal(url.origin + url.pathname, "http://localhost:3001/v1/media");

    const body = captured.init.body as FormData;
    assert.ok(body instanceof FormData);
    // `UPLOAD_FIELD_NAME = 'file'` (upload.options.ts) — the exact field the
    // backend's FileInterceptor reads; a mismatch fails as a multer 400.
    assert.equal(body.get("file"), file as unknown as FormDataEntryValue);
    assert.equal(body.get("altText"), "a pixel");
    assert.equal(body.get("title"), "Pixel");

    const headers = captured.init.headers as Record<string, string>;
    assert.equal(headers["Content-Type"], undefined);
    assert.equal(headers["content-type"], undefined);
    // No token in session → no Authorization header
    assert.equal(headers.Authorization, undefined);

    assert.ok(result);
    assert.equal(result.id, "m3");
  });

  it("omits blank/absent metadata fields entirely", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [{ status: 201, body: successBody(makeMediaRow("m4")) }],
      captures,
    );
    const file = new File([new Uint8Array([1])], "dot.png", {
      type: "image/png",
    });

    await uploadMedia(file, { altText: "   " });

    const body = captures[0].init.body as FormData;
    assert.equal(body.has("altText"), false);
    assert.equal(body.has("title"), false);
    assert.equal(body.get("file"), file as unknown as FormDataEntryValue);
  });

  it("sends Bearer from the client session when a token exists", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [{ status: 201, body: successBody(makeMediaRow("m5")) }],
      captures,
    );
    __setAccessTokenForTest("session-token-abc");

    await uploadMedia(
      new File([new Uint8Array([1])], "dot.png", { type: "image/png" }),
    );

    const headers = captures[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer session-token-abc");
    assert.equal(headers["Content-Type"], undefined);
  });
});

// ---------------------------------------------------------------------------
// DELETE /media/:id (soft delete) and DELETE /media/:id/purge
// ---------------------------------------------------------------------------

describe("deleteMedia — soft delete", () => {
  it("sends DELETE /media/:id and resolves undefined on 204", async () => {
    const captures: Captured[] = [];
    captureFetchSequence([{ status: 204 }], captures);
    const id = "6f1c1e5e-0b3f-4f0a-9c3a-1b2c3d4e5f60";

    const result = await deleteMedia(id);

    const captured = captures[0];
    assert.equal(captured.init.method, "DELETE");
    assert.ok(captured.url.endsWith(`/v1/media/${id}`));
    assert.equal(result, undefined);
  });

  it("surfaces the honest 404 on a repeat delete of the same id", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [
        { status: 204 },
        {
          status: 404,
          body: failureBody({
            statusCode: 404,
            message: "No active media with that id",
            code: "NotFoundException",
          }),
        },
      ],
      captures,
    );
    const id = "6f1c1e5e-0b3f-4f0a-9c3a-1b2c3d4e5f60";

    await assert.doesNotReject(() => deleteMedia(id));
    await assert.rejects(deleteMedia(id), (err: unknown) => {
      assert.ok(err instanceof ApiClientError);
      assert.equal(err.status, 404);
      assert.equal(err.code, "NotFoundException");
      assert.equal(err.message, "No active media with that id");
      return true;
    });
  });
});

describe("purgeMedia — irreversible purge", () => {
  it("sends DELETE /media/:id/purge and resolves undefined on 204", async () => {
    const captures: Captured[] = [];
    captureFetchSequence([{ status: 204 }], captures);
    const id = "6f1c1e5e-0b3f-4f0a-9c3a-1b2c3d4e5f60";

    const result = await purgeMedia(id);

    const captured = captures[0];
    assert.equal(captured.init.method, "DELETE");
    assert.ok(captured.url.endsWith(`/v1/media/${id}/purge`));
    assert.equal(result, undefined);
  });

  it("preserves the reference-blocked 409 message and details verbatim", async () => {
    const captures: Captured[] = [];
    captureFetchSequence(
      [
        {
          status: 409,
          body: failureBody({
            statusCode: 409,
            message: "This media is still referenced and was not purged",
            code: "ConflictException",
            details: { blockedBy: ["product_media", "avatar"] },
          }),
        },
      ],
      captures,
    );

    await assert.rejects(
      purgeMedia("6f1c1e5e-0b3f-4f0a-9c3a-1b2c3d4e5f60"),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal(err.status, 409);
        assert.equal(err.code, "ConflictException");
        assert.equal(
          err.message,
          "This media is still referenced and was not purged",
        );
        assert.deepEqual(err.details, {
          blockedBy: ["product_media", "avatar"],
        });
        return true;
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Contract constants mirrored from the backend
// ---------------------------------------------------------------------------

describe("media contract constants", () => {
  it("mirrors QueryMediaDto.MEDIA_SORTABLE_FIELDS exactly", () => {
    assert.deepEqual(
      [...MEDIA_SORTABLE_FIELDS],
      ["createdAt", "updatedAt", "originalName", "sizeBytes", "mimeType"],
    );
  });

  it("encodes path segments for byId/purge paths", () => {
    assert.equal(MEDIA_PATHS.byId("a/b"), "/media/a%2Fb");
    assert.equal(MEDIA_PATHS.purge("a b"), "/media/a%20b/purge");
    assert.equal(MEDIA_PATHS.list, "/media");
    assert.equal(MEDIA_PATHS.purgeBlocked, "/media/purge-blocked");
  });
});

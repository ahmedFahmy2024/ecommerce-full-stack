/**
 * Generic transport client for the Nest e-commerce backend (remediated T14/T15).
 *
 * Transport-only: headers, URL building, body handling, response parsing, and
 * normalized errors. Single-flight 401 refresh for eligible GETs is handled
 * here, delegating to `auth.ts`'s coordinator which updates the same
 * client-safe session (`session.client.ts`).
 *
 * No UI, no NextAuth, no server token store.
 */

import { isRetryEligible, refreshAccessToken } from "./auth.ts";
import { buildApiUrl, getDashboardApiKey } from "./config.ts";
import type { ApiRequestOptions, HttpMethod } from "./contracts.ts";
import { ApiClientError } from "./contracts.ts";
import { normalizeTransportError, parseApiResponse } from "./errors.ts";
import { getAccessToken } from "./session.client.ts";

// Lang resolver — client-safe (reads `inox` cookie, falls back to `en`)
// Keep test hook so `client.test.ts` can deterministically stub `en`/`ar`
let _langForTest: "en" | "ar" | null = null;

export function __setLangForTest(lang: "en" | "ar"): void {
  _langForTest = lang;
}

export function __resetLangForTest(): void {
  _langForTest = null;
}

function resolveLang(): "en" | "ar" {
  if (_langForTest) return _langForTest;
  try {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )inox=([^;]*)/);
      if (match) {
        const decoded = decodeURIComponent(match[1]);
        return decoded === "ar" ? "ar" : "en";
      }
    }
  } catch {
    // ignore
  }
  return "en";
}

// Test hook for legacy `getLanguageAndToken` stubbing — kept for backwards
// compatibility with existing tests that call `__setLanguageAndTokenForTest`.
// We keep the indirection so tests can stub without touching session directly.
let _langTokenStub: (() => Promise<{ lang: string; token?: string }>) | null =
  null;

export function __setLanguageAndTokenForTest(
  fn: () => Promise<{ lang: string; token?: string }>,
): void {
  _langTokenStub = fn as unknown as () => Promise<{
    lang: string;
    token?: string;
  }>;
}

export function __resetLanguageAndTokenForTest(): void {
  _langTokenStub = null;
  _langForTest = null;
}

const ALLOWED_METHODS: ReadonlySet<string> = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

function normalizeLang(value: string): "en" | "ar" {
  return value === "ar" ? "ar" : "en";
}

function resolvePath(
  path: string,
  params?: Record<string, string | number>,
): string {
  if (!params || Object.keys(params).length === 0) return path;
  let resolved = path;
  for (const [key, value] of Object.entries(params)) {
    const encoded = encodeURIComponent(String(value));
    resolved = resolved.split(`{${key}}`).join(encoded);
    resolved = resolved.split(`:${key}`).join(encoded);
  }
  return resolved;
}

export async function request<TResponse = unknown, TBody = unknown>(
  options: ApiRequestOptions<TResponse, TBody> & { _retried?: boolean },
): Promise<TResponse | undefined> {
  const rawMethod = options.method ?? "GET";
  const method = rawMethod.toUpperCase() as HttpMethod;

  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(
      `[api/client] Unsupported method "${rawMethod}". Allowed: GET, POST, PUT, PATCH, DELETE`,
    );
  }

  // Resolve lang/token — token from client session only (never NextAuth / server)
  let lang: "en" | "ar";
  let token: string | undefined;

  if (_langTokenStub) {
    const stub = await _langTokenStub();
    lang = normalizeLang(stub.lang);
    // Prefer client session token, fallback to stub token for old tests
    token = getAccessToken() ?? stub.token;
  } else {
    lang = _langForTest ? _langForTest : resolveLang();
    token = getAccessToken();
  }

  const resolvedPath = resolvePath(options.path, options.params);
  const url = buildApiUrl(resolvedPath, options.query);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Access-Api": getDashboardApiKey(),
    "x-lang": lang,
  };

  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      headers[k] = v;
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isGetLike = method === "GET";

  let bodyInit: BodyInit | undefined;

  if (!isGetLike && options.body !== undefined && options.body !== null) {
    const body = options.body as unknown;

    if (body instanceof FormData) {
      bodyInit = body as BodyInit;
      delete headers["Content-Type"];
      delete headers["content-type"];
    } else if (typeof Blob !== "undefined" && body instanceof Blob) {
      bodyInit = body as BodyInit;
      if (headers["Content-Type"] === "application/json") {
        delete headers["Content-Type"];
      }
      if (headers["content-type"] === "application/json") {
        delete headers["content-type"];
      }
    } else if (typeof body === "string") {
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
      bodyInit = body as BodyInit;
    } else {
      headers["Content-Type"] = "application/json";
      bodyInit = JSON.stringify(body);
    }
  }

  const fetchInit: RequestInit = {
    method,
    headers,
    credentials: "include",
    ...(options.signal ? { signal: options.signal } : {}),
    ...(bodyInit !== undefined ? { body: bodyInit } : {}),
  };

  try {
    const response = await fetch(url, fetchInit);
    const result = await parseApiResponse<TResponse>(response, {
      method,
      path: resolvedPath,
    });

    if (result.kind === "success") return result.data;
    if (result.kind === "empty") return undefined as TResponse | undefined;

    const apiError = result.error;
    if (
      apiError.status === 401 &&
      !options._retried &&
      token &&
      isRetryEligible({ path: resolvedPath, method, body: options.body })
    ) {
      try {
        await refreshAccessToken();
      } catch (refreshError) {
        if (refreshError instanceof ApiClientError) throw refreshError;
        throw apiError;
      }
      const retryOptions = { ...options, _retried: true } as ApiRequestOptions<
        TResponse,
        TBody
      > & {
        _retried: boolean;
      };
      return request<TResponse, TBody>(retryOptions);
    }

    throw apiError;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw normalizeTransportError(error, method, resolvedPath);
  }
}

export const apiClient = {
  request,
};

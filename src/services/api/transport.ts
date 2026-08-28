/**
 * Narrowly shared transport helper for Nest API (remediation T15).
 *
 * Used by both `client.ts` (generic transport) and `auth.ts` (auth resources)
 * so that auth resources do not re-implement URL/header/parsing logic and
 * there is no circular dependency between `client.ts` and `auth.ts`.
 *
 * Responsibilities:
 * - URL via `buildApiUrl(path, query)` (encodes path segments, query via URLSearchParams)
 * - Headers: `Accept: application/json`, `X-Access-Api` (validated), `x-lang: en|ar`,
 *   optional `Authorization: Bearer <token>` when `withAuth` and a token is available,
 *   `Content-Type` per body type (`application/json` for JSON, omitted for FormData/Blob)
 * - `credentials: "include"` on every request (required for refresh_token cookie)
 * - Body handling (JSON stringify once, FormData/Blob pass-through, GET has no body)
 * - Response parsing via `parseApiResponse` (single `response.text()` consume)
 * - Normalized `ApiClientError` on failure, `undefined` on 204/empty
 *
 * Does NOT handle retry/refresh — that lives in `client.ts` + `auth.ts` coordinator.
 * Does NOT store tokens — callers supply `getToken` or `token` explicitly.
 */

import { buildApiUrl, getDashboardApiKey } from "./config.ts";
import type { ApiRequestOptions, HttpMethod } from "./contracts.ts";
import { normalizeTransportError, parseApiResponse } from "./errors.ts";

type TransportOptions<TResponse, TBody> = {
  path: string;
  method?: HttpMethod;
  query?: ApiRequestOptions<TResponse, TBody>["query"];
  params?: ApiRequestOptions<TResponse, TBody>["params"];
  body?: TBody | FormData | Blob;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  withAuth?: boolean;
  // Token supplier — for client-safe session; if `withAuth` true the transport
  // will call this to obtain the Bearer token (undefined means no Authorization)
  getToken?: () => string | undefined;
  // Or a direct token value (auth.ts convenience for tests)
  token?: string | undefined;
  // Language override — if not supplied the transport resolves `en|ar` via cookie
  lang?: "en" | "ar";
};

function normalizeLang(value: unknown): "en" | "ar" {
  return value === "ar" ? "ar" : "en";
}

function resolveLangSync(): "en" | "ar" {
  // Client-safe locale resolution: read `inox` cookie (next-intl) if available,
  // otherwise fall back to `en`. Never throws.
  try {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )inox=([^;]*)/);
      if (match) {
        const decoded = decodeURIComponent(match[1]);
        return normalizeLang(decoded);
      }
    }
  } catch {
    // ignore
  }
  return "en";
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

/**
 * Low-level Nest fetch — builds URL/headers, performs `fetch`, parses via
 * `parseApiResponse`, returns `T | undefined` or throws `ApiClientError`.
 *
 * Every call sets `credentials: "include"` so the browser's `refresh_token`
 * cookie (scoped to `/v1/auth/refresh`) is sent to the Nest origin.
 */
export async function transportFetch<TResponse = unknown, TBody = unknown>(
  options: TransportOptions<TResponse, TBody>,
): Promise<TResponse | undefined> {
  const method = (options.method ?? "GET").toUpperCase() as HttpMethod;
  const resolvedPath = resolvePath(options.path, options.params);
  const url = buildApiUrl(resolvedPath, options.query);

  const lang = options.lang ?? resolveLangSync();

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

  // Authorization only when explicitly requested and token is available
  const token =
    options.token ?? (options.getToken ? options.getToken() : undefined);
  const withAuth = options.withAuth ?? false;
  if (withAuth && token) {
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
      if (headers["Content-Type"] === "application/json")
        delete headers["Content-Type"];
      if (headers["content-type"] === "application/json")
        delete headers["content-type"];
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

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } catch (cause) {
    throw normalizeTransportError(cause, method, resolvedPath);
  }

  const result = await parseApiResponse<TResponse>(response, {
    method,
    path: resolvedPath,
  });

  if (result.kind === "success") return result.data;
  if (result.kind === "empty") return undefined;
  throw result.error;
}

/**
 * Convenience for callers that want the raw `Response` parsing result
 * without throwing — rarely needed (use `transportFetch` instead).
 */
export { resolveLangSync, normalizeLang };

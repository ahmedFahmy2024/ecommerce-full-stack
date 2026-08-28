/**
 * Generic transport client for the Nest e-commerce backend.
 *
 * Transport-only: headers, URL building, body handling, response parsing, and
 * normalized errors. No UI, auth refresh, redirects, or endpoint registry.
 */

// Auth refresh coordinator (T15) — single-flight, retry once for eligible GET 401s.
// Auth module does not import client.ts, so no circular dependency.
import {
  getStoredAccessToken,
  isRetryEligible,
  refreshAccessToken,
} from "./auth.ts";
import { buildApiUrl, getDashboardApiKey } from "./config.ts";
import type { ApiRequestOptions, HttpMethod } from "./contracts.ts";
import { ApiClientError } from "./contracts.ts";
import { normalizeTransportError, parseApiResponse } from "./errors.ts";
import * as langMod from "./getLanguageAndToken.ts";

// Test hook — allows client.test.ts to stub language/token without ESM mocking.
// Production code never calls this.
let _getLanguageAndToken: typeof langMod.getLanguageAndToken =
  langMod.getLanguageAndToken;
export function __setLanguageAndTokenForTest(
  fn: typeof langMod.getLanguageAndToken,
): void {
  _getLanguageAndToken = fn;
}
export function __resetLanguageAndTokenForTest(): void {
  _getLanguageAndToken = langMod.getLanguageAndToken;
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
    // Support {key} placeholder (legacy + spec) and :key style
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

  const { lang: rawLang, token: langToken } = await _getLanguageAndToken();
  const lang = normalizeLang(rawLang);
  // Single session owner: prefer in-memory stored token (updated by login/refresh),
  // fallback to NextAuth-provided token for server rendering / initial load.
  const storedToken = getStoredAccessToken();
  const token = storedToken ?? langToken;

  const resolvedPath = resolvePath(options.path, options.params);
  const url = buildApiUrl(resolvedPath, options.query);

  // Default headers — transport only
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Access-Api": getDashboardApiKey(),
    "x-lang": lang,
  };

  // Merge caller-provided headers after defaults so callers can add custom headers
  // without overwriting the required transport headers unless they explicitly do.
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
      // Let the browser set multipart boundary — never send a manual Content-Type
      delete headers["Content-Type"];
      delete headers["content-type"];
    } else if (typeof Blob !== "undefined" && body instanceof Blob) {
      bodyInit = body as BodyInit;
      // Preserve blob's own type behavior; do not force application/json
      if (headers["Content-Type"] === "application/json") {
        delete headers["Content-Type"];
      }
      if (headers["content-type"] === "application/json") {
        delete headers["content-type"];
      }
      // Leave Content-Type absent so fetch uses blob.type automatically;
      // if caller supplied a custom Content-Type via options.headers, keep it.
    } else if (typeof body === "string") {
      // Raw string body — send as-is with json content type if not already set
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
      bodyInit = body as BodyInit;
    } else {
      // JSON object — stringify once
      headers["Content-Type"] = "application/json";
      bodyInit = JSON.stringify(body);
    }
  }
  // GET/HEAD-like: bodyInit stays undefined by construction — no body sent

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
    // Single-flight refresh: one eligible authenticated 401 retries once after refresh.
    // Never retried: login/logout/refresh, file uploads, non-GET mutations.
    if (
      apiError.status === 401 &&
      !options._retried &&
      token &&
      isRetryEligible({ path: resolvedPath, method, body: options.body })
    ) {
      try {
        await refreshAccessToken();
      } catch (refreshError) {
        // Refresh failed — local session cleared inside refreshAccessToken.
        // Surface typed unauthenticated error for auth boundary.
        if (refreshError instanceof ApiClientError) throw refreshError;
        throw apiError;
      }
      // Retry exactly once with new token (resolve will pick up stored token)
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

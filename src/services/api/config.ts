/**
 * Validated API configuration and URL builder.
 *
 * Centralizes all reads of `NEXT_PUBLIC_BACKEND_URL` and
 * `NEXT_PUBLIC_DASHBOARD_API_KEY` and exposes a single safe URL builder
 * used by every resource module. No feature code should read `process.env`
 * directly for these values.
 *
 * Rules (from TASK.md T12 / integration plan):
 * - `NEXT_PUBLIC_BACKEND_URL` is required in development with an actionable
 *   error, trailing slashes are removed, `/v1` is preserved, and only
 *   `http:` / `https:` URLs are accepted.
 * - `NEXT_PUBLIC_DASHBOARD_API_KEY` is required in development; its value is
 *   never logged or included in error messages.
 * - `buildApiUrl` / `buildUrl` joins the normalized base with a resource path,
 *   encodes path segments, omits `undefined`/`null`/empty-string query values,
 *   preserves `false` and `0`, supports repeated array keys, and serializes
 *   `Date` values via `toISOString()`.
 */

import type { QueryParams } from "./contracts";

const BACKEND_URL_ENV = "NEXT_PUBLIC_BACKEND_URL";
const DASHBOARD_KEY_ENV = "NEXT_PUBLIC_DASHBOARD_API_KEY";

// ---------------------------------------------------------------------------
// Helpers — keep error messages actionable and secret-free
// ---------------------------------------------------------------------------

function missingBackendUrlError(): Error {
  return new Error(
    `[api/config] Missing ${BACKEND_URL_ENV}. Set it in dashboard/.env.local as ${BACKEND_URL_ENV}=http://localhost:3001/v1 (see dashboard/.env.example).`,
  );
}

function invalidBackendUrlError(raw: string): Error {
  const preview = raw.length > 80 ? `${raw.slice(0, 80)}…` : raw;
  return new Error(
    `[api/config] Invalid ${BACKEND_URL_ENV} "${preview}". Must be a valid http(s) URL including the /v1 base path, e.g. http://localhost:3001/v1.`,
  );
}

function missingDashboardKeyError(): Error {
  return new Error(
    `[api/config] Missing ${DASHBOARD_KEY_ENV}. Set it in dashboard/.env.local as ${DASHBOARD_KEY_ENV}=<value from nest-ecommerce API_KEYS_DASHBOARD> (see dashboard/.env.example).`,
  );
}

/**
 * Normalize and validate the backend base URL.
 *
 * - Trims whitespace.
 * - Removes all trailing slashes (so `http://localhost:3001/v1/` → `http://localhost:3001/v1`).
 * - Rejects empty, malformed, or non-http(s) URLs with a clear error.
 * - Preserves the configured `/v1` base path exactly as provided (minus trailing slash).
 */
function normalizeBackendUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw missingBackendUrlError();
  }

  // Remove trailing slashes but keep protocol/host intact
  const withoutTrailing = trimmed.replace(/\/+$/, "");

  let parsed: URL;
  try {
    parsed = new URL(withoutTrailing);
  } catch {
    throw invalidBackendUrlError(raw);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw invalidBackendUrlError(raw);
  }

  // URL constructor normalizes; reconstructed without trailing slash
  // Preserve original without trailing slash (avoid adding slash for bare host)
  return withoutTrailing;
}

function readBackendUrlRaw(): string | undefined {
  const v = process.env[BACKEND_URL_ENV];
  return typeof v === "string" ? v : undefined;
}

function readDashboardKeyRaw(): string | undefined {
  const v = process.env[DASHBOARD_KEY_ENV];
  return typeof v === "string" ? v : undefined;
}

// ---------------------------------------------------------------------------
// Public getters — validated, secret-safe
// ---------------------------------------------------------------------------

/**
 * Returns the normalized backend base URL (no trailing slash).
 *
 * @throws in development (and in all envs when called) if the variable is
 * missing or malformed. The error message is actionable and never includes
 * the dashboard API key.
 */
export function getBackendUrl(): string {
  const raw = readBackendUrlRaw();

  // Required in development with a clear actionable error. In production we
  // also fail fast rather than silently building broken URLs.
  if (raw === undefined || raw.trim() === "") {
    // Keep message identical dev/prod to avoid leaking env presence; the task
    // explicitly requires a clear dev error, which this satisfies.
    throw missingBackendUrlError();
  }

  return normalizeBackendUrl(raw);
}

/**
 * Returns the dashboard platform API key (`X-Access-Api`).
 *
 * Never logs or includes the key value in errors.
 */
export function getDashboardApiKey(): string {
  const raw = readDashboardKeyRaw();

  if (raw === undefined || raw.trim() === "") {
    throw missingDashboardKeyError();
  }

  // Do not trim interior; only reject whitespace-only. Preserve as-is but
  // trimmed outer whitespace.
  return raw.trim();
}

/**
 * Returns validated API configuration. Convenience for callers that need both
 * values without reading `process.env` directly.
 */
export function getApiConfig(): {
  backendUrl: string;
  dashboardApiKey: string;
} {
  return {
    backendUrl: getBackendUrl(),
    dashboardApiKey: getDashboardApiKey(),
  };
}

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

function encodePath(path: string): string {
  const trimmed = path.trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  // Encode each segment with encodeURIComponent, preserving "/" separators.
  // Decode first (if already encoded) to avoid double-encoding, but tolerate
  // malformed percent sequences.
  return withLeading
    .split("/")
    .map((segment, idx) => {
      if (idx === 0 && segment === "") return "";
      if (segment === "") return "";
      try {
        // Avoid double-encoding: decode then re-encode
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
}

function serializeQueryValue(value: string | number | boolean | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

/**
 * Builds a fully-qualified API URL from the normalized base URL, a resource
 * path, and optional query parameters.
 *
 * - Joins `baseUrl` (no trailing slash) + `path` (ensured leading slash,
 *   segments encoded via `encodeURIComponent`).
 * - Query: omits `undefined`, `null`, and `""`; preserves `false` and `0`;
 *   arrays become repeated keys; `Date` → `toISOString()`; values encoded via
 *   `URLSearchParams` (no manual string concatenation).
 *
 * @param path - Resource path below `/v1`, e.g. `/products` or `/products/123`.
 * @param query - Optional query bag typed via `contracts.ts` `QueryParams`.
 */
export function buildApiUrl(path: string, query?: QueryParams): string {
  const base = getBackendUrl();
  const encodedPath = encodePath(path);
  const url = new URL(`${base}${encodedPath}`);

  if (!query) {
    return url.toString();
  }

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === undefined || rawValue === null) continue;
    // Empty string omitted at top level
    if (rawValue === "") continue;

    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (item === undefined || item === null) continue;
        if (item === "") continue;
        // Dates in arrays: serialize consistently
        const serialized = serializeQueryValue(
          item as string | number | boolean | Date,
        );
        // Preserve false/0: String() already does; empty check above handles ""
        if (serialized === "") continue;
        url.searchParams.append(key, serialized);
      }
      continue;
    }

    // Single value branch
    // Preserve false and 0; omit only undefined/null/"" handled above
    const serialized = serializeQueryValue(
      rawValue as string | number | boolean | Date,
    );
    if (serialized === "") continue;
    url.searchParams.append(key, serialized);
  }

  return url.toString();
}

/**
 * Alias for `buildApiUrl` — the integration plan and TASK.md refer to it as
 * `buildUrl`. Both names are exported so callers can use either.
 */
export const buildUrl = buildApiUrl;

// Backwards-compatible re-export for future client usage
export const getBaseUrl = getBackendUrl;

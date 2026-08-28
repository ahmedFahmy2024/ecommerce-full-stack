/**
 * Response and error normalization for the Nest e-commerce backend.
 *
 * All HTTP/transport failures are converted into the single typed
 * `ApiClientError` contract from `contracts.ts`. Feature code receives one
 * safe, predictable error shape regardless of whether the failure was a Nest
 * `ApiFailure` envelope, a non-JSON HTTP error, malformed JSON, an empty
 * body, a network exception, or an aborted request.
 *
 * Design constraints (TASK.md T13):
 * - Preserve `error.details` verbatim (object/array) — never stringify or
 *   flatten structured domain details (e.g. 409 PRICE_CHANGED payload).
 * - User-facing `message` rule: string → use trimmed value; string[] → join
 *   with "\n" for display while keeping the full array in `details`; empty/
 *   malformed/non-JSON → safe generic fallback; never expose stack traces.
 * - Transport failures (network, abort, non-JSON, malformed, empty) are
 *   normalized separately with distinct `code` values.
 * - Helpers that parse a `Response` consume its body exactly once and return
 *   a discriminated result so the upcoming fetch client can distinguish JSON
 *   success, empty/204 success, and failures without re-parsing.
 * - No UI, auth, or legacy imports.
 */

import {
  ApiClientError,
  type ApiFailure,
  type ApiResponseMeta,
  type ApiSuccess,
  type HttpMethod,
} from "./contracts.ts";

// ---------------------------------------------------------------------------
// Constants — safe, user-facing messages (never raw server internals)
// ---------------------------------------------------------------------------

const GENERIC_FALLBACK = "Something went wrong. Please try again.";
const ABORT_MESSAGE = "Request was cancelled.";
const NETWORK_MESSAGE =
  "Network error. Please check your connection and try again.";

// ---------------------------------------------------------------------------
// Helpers — abort detection, codes, and message normalization
// ---------------------------------------------------------------------------

/**
 * Whether `error` represents an aborted request.
 *
 * Fetch aborts surface as a `DOMException` with `name === "AbortError"` in
 * browsers and as an `Error` with the same `name` in some polyfills / Node.
 */
export function isAbortError(error: unknown): boolean {
  if (error === null || error === undefined) return false;
  if (typeof error === "object" && "name" in error) {
    const name = (error as Record<string, unknown>).name;
    if (name === "AbortError") return true;
  }
  // Some AbortSignal implementations set `code` instead of `name`
  if (
    typeof error === "object" &&
    "code" in error &&
    (error as Record<string, unknown>).code === "ABORTED"
  ) {
    return true;
  }
  return false;
}

/**
 * Fallback `code` for HTTP status when the backend did not provide one.
 * Keeps codes machine-readable and status-derived without leaking internals.
 */
export function codeForStatus(status: number): string {
  if (status === 0) return "NETWORK_ERROR";
  if (status >= 400 && status < 600) return `HTTP_${status}`;
  return "UNKNOWN_ERROR";
}

/**
 * Normalizes a raw `message` value from the backend envelope into a single
 * display string.
 *
 * - `string` → trimmed value if non-empty, else fallback.
 * - `string[]` → filtered non-empty strings joined with "\n" (preserves all
 *   validation messages for display while `details` keeps the full array).
 * - Any other shape → fallback.
 */
export function normalizeMessage(
  rawMessage: unknown,
  fallback: string = GENERIC_FALLBACK,
): string {
  if (typeof rawMessage === "string") {
    const trimmed = rawMessage.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (Array.isArray(rawMessage)) {
    const filtered = (rawMessage as unknown[])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim());
    if (filtered.length === 0) return fallback;
    return filtered.join("\n");
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Envelope detection — narrow parsed JSON without importing runtime guards
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiFailureEnvelope(value: unknown): value is ApiFailure {
  if (!isRecord(value)) return false;
  if (value.success !== false) return false;
  const err = (value as Record<string, unknown>).error;
  if (!isRecord(err)) return false;
  // `statusCode` and `message` presence is enough to treat as envelope
  return "statusCode" in err || "message" in err || "code" in err;
}

function isApiSuccessEnvelope<T>(
  value: unknown,
): value is ApiSuccess<T> & { meta?: ApiResponseMeta } {
  if (!isRecord(value)) return false;
  if (value.success !== true) return false;
  return "data" in value;
}

// ---------------------------------------------------------------------------
// Failure envelope → ApiClientError (preserves details verbatim)
// ---------------------------------------------------------------------------

/**
 * Converts a validated `ApiFailure` envelope into `ApiClientError`.
 *
 * - `status` from `error.statusCode` (fallback to provided `fallbackStatus`).
 * - `code` from `error.code` (fallback to `codeForStatus(status)`).
 * - `details` preserved verbatim when present — object/array or any structured
 *   value the thrower supplied. Not stringified or flattened.
 * - `message` via `normalizeMessage`; empty/invalid message uses generic fallback.
 * - `details` falls back to the original `message` array when no explicit
 *   `details` was present and the message was a non-empty string array. This
 *   keeps validation messages available to form-level handling without
 *   inventing structure for string-message errors.
 */
export function envelopeToApiClientError(
  failure: ApiFailure,
  method: HttpMethod,
  path: string,
): ApiClientError {
  const rawError = failure.error as unknown as Record<string, unknown>;
  const statusRaw = rawError.statusCode;
  const finalStatus =
    typeof statusRaw === "number" &&
    Number.isFinite(statusRaw) &&
    statusRaw !== 0
      ? statusRaw
      : 500;

  const codeRaw = rawError.code;
  const code =
    typeof codeRaw === "string" && codeRaw.trim().length > 0
      ? codeRaw.trim()
      : codeForStatus(finalStatus);

  // Preserve details verbatim — including when null? filter contract says only
  // object/array becomes details, but preserve whatever the backend sent if
  // explicitly present.
  const hasDetails = "details" in rawError;
  const details = hasDetails ? rawError.details : undefined;

  const message = normalizeMessage(rawError.message, GENERIC_FALLBACK);

  // If no explicit details but message was a non-empty array, expose the array
  // as details so form-level handling can use it without re-parsing message.
  const effectiveDetails =
    hasDetails && details !== undefined
      ? details
      : Array.isArray(rawError.message) &&
          (rawError.message as unknown[]).some(
            (v) => typeof v === "string" && (v as string).trim().length > 0,
          )
        ? rawError.message
        : details;

  return new ApiClientError({
    status: finalStatus,
    code,
    message,
    details: effectiveDetails,
    method,
    path,
  });
}

/**
 * Handles parsed JSON that looked like JSON but did not match either envelope
 * shape. Attempts to extract a message-like field; otherwise uses a generic
 * fallback. This covers gateways/proxies that return `{ message, statusCode }`
 * without the `success` wrapper.
 */
function extractGenericJsonError(
  parsed: unknown,
  method: HttpMethod,
  path: string,
  status: number,
): ApiClientError {
  if (isRecord(parsed)) {
    const maybeMessage =
      (parsed as Record<string, unknown>).message ??
      (parsed as Record<string, unknown>).error ??
      undefined;
    const maybeCode = (parsed as Record<string, unknown>).code;
    const maybeDetails = (parsed as Record<string, unknown>).details;
    const maybeStatus = (parsed as Record<string, unknown>).statusCode;

    const resolvedStatus =
      typeof maybeStatus === "number" && Number.isFinite(maybeStatus)
        ? maybeStatus
        : status;

    const code =
      typeof maybeCode === "string" && maybeCode.trim().length > 0
        ? maybeCode.trim()
        : codeForStatus(resolvedStatus);

    // Avoid exposing raw object as message — only use string/array messages
    const message =
      typeof maybeMessage === "string" || Array.isArray(maybeMessage)
        ? normalizeMessage(maybeMessage, GENERIC_FALLBACK)
        : GENERIC_FALLBACK;

    return new ApiClientError({
      status: resolvedStatus,
      code,
      message,
      details: maybeDetails,
      method,
      path,
    });
  }

  return new ApiClientError({
    status,
    code: codeForStatus(status),
    message: GENERIC_FALLBACK,
    method,
    path,
  });
}

// ---------------------------------------------------------------------------
// Transport errors — never expose raw error.message/stack
// ---------------------------------------------------------------------------

/**
 * Normalizes a thrown transport error (network failure, abort, etc.) into
 * `ApiClientError`. Call from a `catch` around `fetch`.
 *
 * - Aborts → `code: "ABORTED"`, `status: 0`, safe cancel message.
 * - All other throws → `code: "NETWORK_ERROR"`, `status: 0`, safe network message.
 * - Original error is preserved as `cause` for diagnostics but never surfaced
 *   in `message`.
 */
export function normalizeTransportError(
  error: unknown,
  method: HttpMethod,
  path: string,
): ApiClientError {
  if (isAbortError(error)) {
    return new ApiClientError({
      status: 0,
      code: "ABORTED",
      message: ABORT_MESSAGE,
      method,
      path,
      cause: error,
    });
  }

  return new ApiClientError({
    status: 0,
    code: "NETWORK_ERROR",
    message: NETWORK_MESSAGE,
    method,
    path,
    cause: error,
  });
}

// ---------------------------------------------------------------------------
// Response parser — consumes body exactly once, returns discriminated result
// ---------------------------------------------------------------------------

export type ApiSuccessResult<T> = {
  kind: "success";
  data: T;
  status: number;
  meta?: ApiResponseMeta;
};

export type ApiEmptyResult = {
  kind: "empty";
  status: number;
};

export type ApiFailureResult = {
  kind: "failure";
  error: ApiClientError;
};

export type ApiParseResult<T> =
  | ApiSuccessResult<T>
  | ApiEmptyResult
  | ApiFailureResult;

/**
 * Parses a `Response` exactly once (via `response.text()`) and returns a
 * discriminated result so the caller can distinguish:
 * - `success` — JSON `ApiSuccess` envelope unwrapped to `data`
 * - `empty` — 204/205 or 2xx with empty body (no `response.json()` call)
 * - `failure` — `ApiFailure` envelope, non-JSON error, malformed JSON, or
 *   empty error body, all normalized to `ApiClientError`
 *
 * The body is read via `text()` once and then `JSON.parse`d in-memory when
 * the content type / body warrants it. Callers must not call `json()`/`text()`
 * on the same response again.
 */
export async function parseApiResponse<T>(
  response: Response,
  request: { method: HttpMethod; path: string },
): Promise<ApiParseResult<T>> {
  const { method, path } = request;
  const status = response.status;

  // 204/205 never have a body per RFC — treat as empty success without reading
  if (status === 204 || status === 205) {
    return { kind: "empty", status };
  }

  let text: string;
  try {
    text = await response.text();
  } catch (cause) {
    return {
      kind: "failure",
      error: new ApiClientError({
        status: status || 0,
        code: codeForStatus(status),
        message: GENERIC_FALLBACK,
        method,
        path,
        cause,
      }),
    };
  }

  if (text.trim() === "") {
    if (response.ok) {
      return { kind: "empty", status };
    }
    return {
      kind: "failure",
      error: new ApiClientError({
        status,
        code: codeForStatus(status),
        message: GENERIC_FALLBACK,
        method,
        path,
      }),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    // Malformed JSON — distinguish success vs error status for code
    if (response.ok) {
      return {
        kind: "failure",
        error: new ApiClientError({
          status,
          code: "MALFORMED_RESPONSE",
          message: GENERIC_FALLBACK,
          method,
          path,
          cause,
        }),
      };
    }
    return {
      kind: "failure",
      error: new ApiClientError({
        status,
        code: codeForStatus(status),
        message: GENERIC_FALLBACK,
        method,
        path,
        cause,
      }),
    };
  }

  if (isApiFailureEnvelope(parsed)) {
    const failure = parsed as ApiFailure;
    // Ensure status reflects HTTP status when envelope statusCode is missing/0
    const normalizedStatus =
      typeof failure.error.statusCode === "number" &&
      Number.isFinite(failure.error.statusCode) &&
      failure.error.statusCode !== 0
        ? failure.error.statusCode
        : status;
    const normalizedFailure: ApiFailure = {
      ...failure,
      error: {
        ...failure.error,
        statusCode: normalizedStatus,
      },
    };
    return {
      kind: "failure",
      error: envelopeToApiClientError(normalizedFailure, method, path),
    };
  }

  if (isApiSuccessEnvelope<T>(parsed)) {
    const success = parsed as ApiSuccess<T>;
    return {
      kind: "success",
      data: success.data as T,
      status,
      meta: success.meta,
    };
  }

  if (response.ok) {
    // 2xx JSON without envelope — treat parsed body as data (defensive for
    // health checks or future SkipTransform endpoints)
    return { kind: "success", data: parsed as T, status };
  }

  return {
    kind: "failure",
    error: extractGenericJsonError(parsed, method, path, status),
  };
}

/**
 * Convenience: parses a `Response` and either returns unwrapped `data`
 * (or `undefined` for empty) or throws the normalized `ApiClientError`.
 *
 * Useful for the upcoming fetch client where most call sites want a direct
 * `T | undefined` return and a single `throw` path.
 */
export async function parseOrThrow<T>(
  response: Response,
  request: { method: HttpMethod; path: string },
): Promise<T | undefined> {
  const result = await parseApiResponse<T>(response, request);
  if (result.kind === "failure") throw result.error;
  if (result.kind === "empty") return undefined;
  return result.data;
}

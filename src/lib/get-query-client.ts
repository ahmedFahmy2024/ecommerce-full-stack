import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import { isServer } from "@/services/api/environment";
import { ApiClientError } from "@/services/api/contracts";

// Source-verified via opensrc: TanStack Query `QueryClient` defaultOptions.queries.retry
// defaults to false for `query-core` when undefined (QueryClient.ts:366), but we
// make the contract explicit per TASK T20 / AGENTS.md data tables: never retry
// auth/validation/conflict. `retry: (count, error) => boolean` is the documented
// `RetryValue` signature from `query-core/src/retryer.ts:34` (ShouldRetryFunction).
function shouldRetryQuery(
  _failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof ApiClientError) {
    // Source: contracts.ts:ApiClientError status mirrors Nest HTTP codes.
    // Never retry client errors that indicate auth/validation/conflict.
    if ([400, 401, 403, 404, 409, 422, 429].includes(error.status)) {
      return false;
    }
    // 5xx and network errors (status 0) are retriable; status 0 is NETWORK_ERROR/ABORTED
    // from errors.ts:normalizeTransportError — abort should not retry
    if (error.code === "ABORTED") return false;
    return true;
  }
  // Non-ApiClientError (TypeError, etc.) — let default network retry handle it,
  // but cap at 1 retry to avoid hammering
  return false;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
        // Verified via opensrc: query-core/src/retryer.ts RetryValue<TError>
        // Do not retry auth/validation/conflict per T20.
        retry: shouldRetryQuery,
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        shouldRedactErrors: () => {
          // We should not catch Next.js server errors
          // as that's how Next.js detects dynamic pages
          // so we cannot redact them.
          // Next.js also automatically redacts errors for us
          // with better digests.
          return false;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer()) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

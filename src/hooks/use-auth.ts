"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/services/api/auth";
import { authKeys } from "@/services/api/query-keys";

/**
 * Authoritative identity hook (T21).
 *
 * Loads `GET /auth/me` as the single source of truth for the current
 * authenticated user. Does NOT derive identity from the login response
 * alone — the login payload is stale once the backend rotates data.
 *
 * Uses `authKeys.me()` (`['auth','me']`) so the key is stable and
 * invalidatable on logout/refresh. `enabled` is browser-only because
 * the access token lives solely in `session.client.ts` (browser memory,
 * never Node module-global, never localStorage) and cannot be read on
 * the server. Server render therefore shows the loading skeleton until
 * the client fetch resolves — this avoids a false 401 from a server-side
 * fetch that would never see the browser's bearer token.
 *
 * No `NEXT_PUBLIC_*` reads, no `fetch`, no UI imports — only the
 * transport boundary via `getMe()`. Retry is delegated to the global
 * `getQueryClient` contract: never retry 401/403/404/409/422/429/ABORTED
 * (see `src/lib/get-query-client.ts:14`). The client-level single-flight
 * refresh in `client.ts` already retries eligible 401s once *before* the
 * query sees a final error, so an `isError` with status 401 here means
 * the session is truly expired.
 */
export function useAuth() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => getMe(),
    // Client-only: `getMe` reads `getAccessToken()` from browser memory.
    // On the server there is no token (and no refresh cookie transport),
    // so a server fetch would always 401 and hide a valid browser session.
    enabled: typeof window !== "undefined",
    // Do not retry auth validation here; global shouldRetryQuery already
    // blocks 401/403. Explicit `retry: false` prevents the query layer
    // from adding a second retry on top of client.ts single-flight.
    retry: false,
    staleTime: 30 * 1000,
  });
}

export type UseAuthReturn = ReturnType<typeof useAuth>;

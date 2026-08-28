/**
 * REMOVED — NextAuth-based locale+token resolver (remediation T15).
 *
 * Previous implementation read the access token from `next-auth` server/client
 * session (`auth()` / `getSession()`) and mirrored it via a Node module-global
 * (`_accessToken`) that leaked between requests. It also returned `lang` via
 * `next-intl/server` on the server.
 *
 * Remediation: token lives only in `session.client.ts` (browser memory, client-only).
 * Locale is resolved via `transport.ts` `resolveLangSync()` which reads the `inox`
 * cookie (`next-intl` locale). Do not import `next-auth` for Nest API auth.
 *
 * This stub is kept so that old type-only imports (`typeof import("./getLanguageAndToken")`)
 * continue to type-check while deleted pages are being removed. It throws at
 * runtime if called — the call site must be migrated to `session.client.ts` +
 * `transport.ts`.
 */

// Keep the same exported name so `rg` finds no missing-module errors during
// incremental deletion; new code must not import this.
export const getLanguageAndToken = async (): Promise<{
  lang: "en" | "ar";
  token?: string;
}> => {
  throw new Error(
    "[getLanguageAndToken] removed in T15 remediation. Token is now in services/api/session.client.ts (client-only); locale via services/api/transport.ts resolveLangSync(). See TASK.md T15.",
  );
};

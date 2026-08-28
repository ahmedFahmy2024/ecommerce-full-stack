/**
 * REMOVED — NextAuth Credentials transport (remediation T15).
 *
 * Previous file implemented NextAuth Credentials.authorize that performed a
 * server-side etch to POST /auth/login with credentials: 'include'.
 * A server-side fetch cannot deliver Nest's Set-Cookie: refresh_token to the
 * browser (the cookie belongs to the Nest API origin, not the Next server).
 * The module also mirrored the access token in a Node module-global variable via
 * services/api/auth.ts (_accessToken), which can leak authorization between
 * requests on the Next server.
 *
 * Remediation: browser-direct Nest auth. Login/refresh are now invoked by the
 * browser directly against NEXT_PUBLIC_BACKEND_URL with credentials: 'include'
 * via services/api/auth.ts and the token lives only in client-scoped memory
 * (services/api/session.client.ts, "use client", never Node global, never
 * localStorage). Do not re-add NextAuth Credentials as the Nest login transport.
 *
 * This stub file exists so imports like \import { auth } from \"@/auth\"\ fail
 * with a clear remediation message at build time instead of a silent missing-module.
 */

throw new Error(
  "[auth] src/auth.ts was removed in T15 remediation. Use browser-direct Nest auth via services/api/auth.ts + services/api/session.client.ts. See TASK.md T15.",
);

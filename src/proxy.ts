import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Temporary middleware boundary (remediation T15/T16).
 *
 * Previous implementation fetched `GET /users/:id/permissions` to enforce
 * route permissions. That Nest route does not exist (`users.controller.ts`
 * exposes only list/get/create/update/delete for `user:*` platform dashboard,
 * and `GET /auth/me` returns `UserResource` without a permission list). The
 * fetch therefore 404'd and caused false denials, blocking legitimate users.
 *
 * Remediation: remove the permission gate entirely. Until T21 defines a real,
 * permission-aware route model (backed by a verified Nest endpoint that exposes
 * the current user's permissions/roles), middleware MUST NOT pretend to
 * authorize users.
 *
 * Current behavior is intentionally minimal:
 * - Runs next-intl middleware for locale prefixing (`as-needed`, default `en`,
 *   cookie `inox`).
 * - Does NOT check authentication, does NOT redirect to `/login` or `/denied`,
 *   does NOT call any Nest endpoint.
 *
 * T21 follow-up (required):
 * - Define how permissions are obtained: either a new Nest endpoint that returns
 *   permissions for the current user, or derive from `GET /auth/me` plus a
 *   documented role→permission map. Until that endpoint exists, do NOT re-add
 *   a guessed `GET /users/:id/permissions` or `GET /auth/permissions` call.
 * - Re-introduce protected-shell logic as a **client** auth boundary (React
 *   context that loads `GET /auth/me` via `services/api/auth.ts` and redirects
 *   unauthenticated users to `/login`). Middleware will then only handle locale
 *   (and possibly a soft public-route redirect that does not enforce permissions).
 * - Until then, every `(dashboard)` route is reachable without a session — this
 *   is known and documented here, not a silent regression.
 *
 * Security note: hiding UI controls is NOT authorization. Backend guards
 * (`@Auth(PERMISSION.*)`) remain authoritative. T22 will hide unavailable
 * navigation entries once the real permission source is available.
 */

const intlMiddleware = createMiddleware(routing);

// `proxy` is the Next 15 convention for `middleware.ts` (previously `middleware`).
// Keeping the `proxy` export name aligns with `next.config.ts` / `src/proxy.ts`
// as used in this project.
export function proxy(request: Request): ReturnType<typeof intlMiddleware> {
  // No auth, no permission fetch — locale only
  // `createMiddleware` expects a NextRequest; cast via unknown for typing
  return intlMiddleware(
    request as unknown as Parameters<typeof intlMiddleware>[0],
  );
}

// Re-export as `middleware` as well for Next's file-based discovery if needed
export const middleware = proxy;

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

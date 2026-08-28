import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { auth } from "@/auth";
import {
  lookupRouteRequirement,
  stripLocale,
} from "@/lib/authz/route-permissions";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];
const ALWAYS_ALLOWED_AUTHENTICATED = ["/denied"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isAlwaysAllowed(pathname: string): boolean {
  return ALWAYS_ALLOWED_AUTHENTICATED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Legacy permission gate — Edge middleware cannot import the full API client
 * (Edge runtime + `auth` wrapper). This direct `fetch` is the *only* Nest
 * API call allowed outside `services/api/client.ts` / `services/api/auth.ts`.
 * It uses the dashboard platform key (`NEXT_PUBLIC_DASHBOARD_API_KEY`,
 * header `X-Access-Api`) and Bearer token, and will be replaced in T21 by
 * `GET /auth/me` via the new client (authoritative permissions from
 * `UserResource` + `role_permissions`). The endpoint `GET /users/:id/permissions`
 * is legacy (not in Nest `users.controller.ts`); it returns 404 on the new
 * backend and is treated as empty permissions until T21.
 */
async function fetchUserPermissions(
  userId: string,
  accessToken: string | undefined,
  origin: string,
): Promise<Set<string>> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  // Dashboard platform key — never log, never use the old `NEXT_PUBLIC_API_KEY` name.
  const apiKey = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || "";
  try {
    const res = await fetch(`${baseUrl}/users/${userId}/permissions`, {
      headers: {
        accept: "application/json",
        "X-Access-Api": apiKey,
        "x-lang": "en",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      // Edge runtime — no caching across requests; we want per-user freshness
      cache: "no-store",
    });
    if (!res.ok) return new Set();
    const json = (await res.json()) as {
      data?: { permissions?: string[] };
    };
    return new Set(json.data?.permissions ?? []);
  } catch {
    return new Set();
  }
}

export const proxy = auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isPublic = isPublicPath(pathname);

  if (isLoggedIn && isPublic) {
    const segments = pathname.split("/");
    const maybeLocale = segments[1];
    const validLocale = (routing.locales as readonly string[]).includes(
      maybeLocale,
    );
    const homePath =
      validLocale && maybeLocale !== routing.defaultLocale
        ? `/${maybeLocale}`
        : "/";
    return NextResponse.redirect(new URL(homePath, req.nextUrl.origin));
  }

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated route — check permission requirements
  if (isLoggedIn && !isPublic && !isAlwaysAllowed(pathname)) {
    const cleanPath = stripLocale(pathname, routing.locales);
    const requirement = lookupRouteRequirement(cleanPath);

    if (requirement) {
      const userId = req.auth?.user?.id;
      const accessToken = req.auth?.user?.accessToken;
      if (userId) {
        const permissions = await fetchUserPermissions(
          userId,
          accessToken,
          req.nextUrl.origin,
        );

        const required = Array.isArray(requirement)
          ? requirement
          : [requirement];
        const hasAny = required.some((p) => permissions.has(p));

        if (!hasAny) {
          const segments = pathname.split("/");
          const maybeLocale = segments[1];
          const validLocale = (routing.locales as readonly string[]).includes(
            maybeLocale,
          );
          const deniedPath =
            validLocale && maybeLocale !== routing.defaultLocale
              ? `/${maybeLocale}/denied`
              : "/denied";
          return NextResponse.redirect(new URL(deniedPath, req.nextUrl.origin));
        }
      }
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

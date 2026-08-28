import { PERMISSION, type Permission } from "./permissions";

/**
 * Routes that need a permission gate beyond "logged in". Keys are path
 * prefixes (without locale segment). The longest matching prefix wins.
 *
 * The proxy strips the locale prefix before matching. So "/roles" applies
 * to both "/en/roles" and "/ar/roles", and "/roles/create" overrides
 * "/roles" when the user lands on the create page.
 *
 * Public paths (/login, /denied, etc.) MUST NOT appear here.
 */
export const ROUTE_PERMISSIONS: Record<string, Permission | Permission[]> = {
  // user management
  "/users": PERMISSION.USER.LIST,
  "/users/create": PERMISSION.USER.CREATE,
  "/users/edit": PERMISSION.USER.UPDATE,
  "/users/view": PERMISSION.USER.VIEW,

  "/students": PERMISSION.USER.LIST,
  "/students/create": PERMISSION.USER.CREATE,
  "/students/edit": PERMISSION.USER.UPDATE,
  "/students/view": PERMISSION.USER.VIEW,

  "/instructors": PERMISSION.USER.LIST,
  "/instructors/create": PERMISSION.USER.CREATE,
  "/instructors/edit": PERMISSION.USER.UPDATE,
  "/instructors/view": PERMISSION.USER.VIEW,

  "/supervisors": PERMISSION.USER.LIST,
  "/supervisors/create": PERMISSION.USER.CREATE,
  "/supervisors/edit": PERMISSION.USER.UPDATE,
  "/supervisors/view": PERMISSION.USER.VIEW,

  "/roles": PERMISSION.ROLE.LIST,
  "/roles/create": PERMISSION.ROLE.CREATE,
  "/roles/edit": PERMISSION.ROLE.UPDATE,

  "/permissions": PERMISSION.PERMISSION_ENTITY.LIST,
  "/permissions/create": PERMISSION.PERMISSION_ENTITY.CREATE,
  "/permissions/edit": PERMISSION.PERMISSION_ENTITY.UPDATE,
  "/permissions/view": PERMISSION.PERMISSION_ENTITY.VIEW,

  // geography
  "/countries": PERMISSION.COUNTRY.LIST,
  "/countries/create": PERMISSION.COUNTRY.CREATE,
  "/countries/edit": PERMISSION.COUNTRY.UPDATE,
  "/countries/view": PERMISSION.COUNTRY.VIEW,

  "/cities": PERMISSION.CITY.LIST,
  "/cities/create": PERMISSION.CITY.CREATE,
  "/cities/edit": PERMISSION.CITY.UPDATE,
  "/cities/view": PERMISSION.CITY.VIEW,

  "/districts": PERMISSION.DISTRICT.LIST,
  "/districts/create": PERMISSION.DISTRICT.CREATE,
  "/districts/edit": PERMISSION.DISTRICT.UPDATE,
  "/districts/view": PERMISSION.DISTRICT.VIEW,

  // education
  "/categories": PERMISSION.CATEGORY.LIST,
  "/categories/create": PERMISSION.CATEGORY.CREATE,
  "/categories/edit": PERMISSION.CATEGORY.UPDATE,
  "/categories/view": PERMISSION.CATEGORY.VIEW,

  "/stages": PERMISSION.STAGE.LIST,
  "/stages/create": PERMISSION.STAGE.CREATE,
  "/stages/edit": PERMISSION.STAGE.UPDATE,
  "/stages/view": PERMISSION.STAGE.VIEW,

  "/batches": PERMISSION.BATCH.LIST,
  "/batches/create": PERMISSION.BATCH.CREATE,
  "/batches/edit": PERMISSION.BATCH.UPDATE,
  "/batches/view": PERMISSION.BATCH.VIEW,

  "/classes": PERMISSION.CLASS.LIST,
  "/classes/create": PERMISSION.CLASS.CREATE,
  "/classes/edit": PERMISSION.CLASS.UPDATE,
  "/classes/view": PERMISSION.CLASS.VIEW,

  "/materials": PERMISSION.MATERIAL.LIST,
  "/materials/create": PERMISSION.MATERIAL.CREATE,
  "/materials/edit": PERMISSION.MATERIAL.UPDATE,
  "/materials/view": PERMISSION.MATERIAL.VIEW,

  // learning resources
  "/banners": PERMISSION.BANNER.LIST,
  "/banners/create": PERMISSION.BANNER.CREATE,
  "/banners/edit": PERMISSION.BANNER.UPDATE,
  "/banners/view": PERMISSION.BANNER.VIEW,

  "/forms": PERMISSION.FORM.LIST,
  "/forms/create": PERMISSION.FORM.CREATE,
  "/forms/edit": PERMISSION.FORM.UPDATE,
  "/forms/view": PERMISSION.FORM.VIEW,

  "/quizzes": PERMISSION.QUIZ.LIST,
  "/quizzes/create": PERMISSION.QUIZ.CREATE,
  "/quizzes/edit": PERMISSION.QUIZ.UPDATE,
  "/quizzes/view": PERMISSION.QUIZ.VIEW,
};

/**
 * Strip a leading locale segment from a pathname if present.
 * "/en/roles/create" → "/roles/create"
 * "/ar/users" → "/users"
 * "/roles" → "/roles"
 */
export function stripLocale(
  pathname: string,
  locales: readonly string[],
): string {
  const match = pathname.match(/^\/([^/]+)(\/.*|$)/);
  if (!match) return pathname;
  const [, first, rest] = match;
  if (locales.includes(first)) return rest || "/";
  return pathname;
}

/**
 * Look up the permission requirement for a given pathname. Returns the
 * longest-matching prefix's requirement, or `null` if no rule applies
 * (i.e. the route is open to any authenticated user).
 */
export function lookupRouteRequirement(
  pathname: string,
): Permission | Permission[] | null {
  let bestMatch: { length: number; req: Permission | Permission[] } | null =
    null;
  for (const [prefix, req] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (!bestMatch || prefix.length > bestMatch.length) {
        bestMatch = { length: prefix.length, req };
      }
    }
  }
  return bestMatch?.req ?? null;
}

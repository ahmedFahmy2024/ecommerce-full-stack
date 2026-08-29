/**
 * E-commerce navigation config (T22).
 *
 * Replaces the deleted `src/config/menus.ts` (education domain).
 * Groups exactly: Overview / Catalog (categories/products/variants/inventory/media)
 * / Sales (orders/payments/shipments/shipping-methods) / Customers (users)
 * / Marketing (coupons/reviews) / Account (profile/sessions).
 *
 * - Each item declares an optional `permission` (value from nest PERMISSIONS).
 *   The sidebar hides items when the current user lacks it (UX only — backend
 *   @Auth remains authoritative). Items with no permission are visible to any
 *   authenticated user.
 * - Labels and hrefs come exclusively from the e-commerce domain below; no
 *   label or route from the previous education-domain template survives here.
 * - Routes are typed as hrefs for `Link from @/i18n/navigation` (localePrefix: as-needed).
 * - No NEXT_PUBLIC reads, no fetch, no UI imports here.
 */

export interface NavItem {
  label: string;
  href: string;
  permission?: string;
  /** Optional icon key — resolved in the sidebar via lucide mapping */
  icon?: NavIconKey;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export type NavIconKey =
  | "overview"
  | "categories"
  | "products"
  | "variants"
  | "inventory"
  | "media"
  | "orders"
  | "payments"
  | "shipments"
  | "shipping-methods"
  | "users"
  | "coupons"
  | "reviews"
  | "profile"
  | "sessions";

/**
 * Permission strings mirror `nest-ecommerce/src/identity/rbac.constants.ts` PERMISSIONS.
 * Keep string literals (not imported) so this config stays client-safe and does not
 * require a backend build artifact. Values are verified against backend at author time.
 */
export const navGroups: readonly NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: "overview" }],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      {
        label: "Categories",
        href: "/categories",
        icon: "categories",
        permission: "category:read",
      },
      {
        label: "Products",
        href: "/products",
        icon: "products",
        permission: "product:read",
      },
      {
        label: "Variants",
        href: "/variants",
        icon: "variants",
        permission: "product:read",
      },
      {
        label: "Inventory",
        href: "/inventory",
        icon: "inventory",
        permission: "inventory:read",
      },
      {
        label: "Media",
        href: "/media",
        icon: "media",
        permission: "media:read",
      },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      {
        label: "Orders",
        href: "/orders",
        icon: "orders",
        permission: "order:read",
      },
      {
        label: "Payments",
        href: "/payments",
        icon: "payments",
        permission: "payment:read",
      },
      {
        label: "Shipments",
        href: "/shipments",
        icon: "shipments",
        permission: "shipment:read",
      },
      {
        label: "Shipping Methods",
        href: "/shipping-methods",
        icon: "shipping-methods",
        permission: "shipping-method:manage",
      },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: "users",
        permission: "user:read",
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      {
        label: "Coupons",
        href: "/coupons",
        icon: "coupons",
        permission: "coupon:read",
      },
      {
        label: "Reviews",
        href: "/reviews",
        icon: "reviews",
        permission: "review:moderate",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: "profile" },
      { label: "Sessions", href: "/sessions", icon: "sessions" },
    ],
  },
] as const;

/** Flat list of all hrefs for breadcrumb / active matching */
export const allNavHrefs: readonly string[] = navGroups.flatMap((g) =>
  g.items.map((i) => i.href),
);

/** Find label for a given pathname (exact or prefix for nested routes) */
export function findNavLabel(pathname: string): string | undefined {
  // Prefer exact match, then longest prefix
  let best: { href: string; label: string } | undefined;
  for (const g of navGroups) {
    for (const item of g.items) {
      if (pathname === item.href) return item.label;
      if (
        item.href !== "/" &&
        pathname.startsWith(`${item.href}/`) &&
        (!best || item.href.length > best.href.length)
      ) {
        best = { href: item.href, label: item.label };
      }
    }
  }
  if (best) return best.label;
  // Root fallback
  if (pathname === "/") return "Dashboard";
  return undefined;
}

/** Group lookup by href for breadcrumb group label */
export function findNavGroupLabel(pathname: string): string | undefined {
  let best: { href: string; groupLabel: string } | undefined;
  for (const g of navGroups) {
    for (const item of g.items) {
      if (pathname === item.href) return g.label;
      if (
        item.href !== "/" &&
        pathname.startsWith(`${item.href}/`) &&
        (!best || item.href.length > best.href.length)
      ) {
        best = { href: item.href, groupLabel: g.label };
      }
    }
  }
  if (pathname === "/") return "Overview";
  return best?.groupLabel;
}

/**
 * Find the nav item matching a pathname (exact match first, then the longest
 * prefix). Consumed by the shell breadcrumb (`NavBreadcrumb`) so header
 * labels derive from this config instead of a second hardcoded list.
 */
export function findNavItem(pathname: string): NavItem | undefined {
  let best: NavItem | undefined;
  for (const g of navGroups) {
    for (const item of g.items) {
      if (pathname === item.href) return item;
      if (
        item.href !== "/" &&
        pathname.startsWith(`${item.href}/`) &&
        (!best || item.href.length > best.href.length)
      ) {
        best = item;
      }
    }
  }
  return best;
}

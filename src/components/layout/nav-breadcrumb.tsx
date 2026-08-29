"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { findNavGroupLabel, findNavItem } from "@/config/navigation";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Shell breadcrumb (T22) — client leaf.
 *
 * Derives group/page labels from the e-commerce navigation config
 * (`src/config/navigation.ts`) so the header always mirrors the sidebar
 * without duplicating labels. `usePathname` from `@/i18n/navigation` returns
 * the pathname with the `en|ar` prefix stripped (localePrefix "as-needed"),
 * which matches the plain hrefs in the nav config. The only navigation link
 * (a nested route back to its section root) goes through `Link from
 * "@/i18n/navigation"` — never `next/link` — so the locale prefix is
 * preserved. The chevron separator flips in RTL via `rtl:rotate-180`
 * (html[dir="rtl"] is set by the root layout from `getDirection`).
 */
export function NavBreadcrumb() {
  const pathname = usePathname();
  const item = findNavItem(pathname);
  const groupLabel = findNavGroupLabel(pathname) ?? "Overview";

  if (!item) {
    // Unmatched deep route (e.g. a 404 inside the shell) — honest fallback.
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const isExact = pathname === item.href;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <span className="text-muted-foreground">{groupLabel}</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="rtl:rotate-180" />
        <BreadcrumbItem>
          {isExact ? (
            <BreadcrumbPage>{item.label}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href={item.href}>{item.label}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

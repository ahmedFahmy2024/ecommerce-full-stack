"use client";

import {
  Command,
  CreditCard,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Monitor,
  Package,
  Settings2,
  ShoppingCart,
  Star,
  Tags,
  Ticket,
  Truck,
  User,
  Users,
  Warehouse,
} from "lucide-react";
import { useLocale } from "next-intl";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { navGroups, type NavIconKey } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { usePermissions } from "@/hooks/use-permissions";
import { Link, usePathname } from "@/i18n/navigation";
import { getDirection } from "@/lib/direction";

const iconMap: Record<NavIconKey, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  categories: Tags,
  products: Package,
  variants: Layers,
  inventory: Warehouse,
  media: ImageIcon,
  orders: ShoppingCart,
  payments: CreditCard,
  shipments: Truck,
  "shipping-methods": Settings2,
  users: Users,
  coupons: Ticket,
  reviews: Star,
  profile: User,
  sessions: Monitor,
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * E-commerce sidebar (T22).
 *
 * - Renders `navGroups` (Overview / Catalog / Sales / Customers / Marketing / Account).
 * - RTL-aware `side` via `getDirection(locale)`.
 * - Active state via `usePathname()` from `@/i18n/navigation` (localePrefix as-needed).
 * - Permission-aware hiding via `usePermissions()` deriving from `useAuth()` (`GET /auth/me`);
 *   never calls guessed `/users/:id/permissions` or `/auth/permissions`.
 *   Items with no `permission` are visible to any authenticated user; items with a
 *   permission are hidden when the current user's permission set lacks it (UX only,
 *   backend `@Auth()` remains authoritative and returns 403 → denied state).
 * - Uses `Link from @/i18n/navigation` (not `next/link`) to preserve `en|ar` prefix.
 * - Client leaf for pathname/permission state; shell layout stays Server.
 */
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const locale = useLocale();
  const pathname = usePathname();
  const { has, isLoading } = usePermissions();
  const side = getDirection(locale) === "rtl" ? "right" : "left";

  return (
    <Sidebar variant="inset" side={side} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-sm leading-tight ltr:text-left rtl:text-right">
                  <span className="truncate font-semibold">
                    {siteConfig.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin Dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground" role="status" aria-busy="true">
            <span className="sr-only">Loading navigation</span>
            Loading…
          </div>
        ) : (
          navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => has(item.permission));
            if (visibleItems.length === 0) return null;
            return (
              <SidebarGroup key={group.id}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => {
                      const Icon = item.icon ? iconMap[item.icon] : undefined;
                      const active = isActivePath(pathname, item.href);
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                            <Link href={item.href as "/"}>
                              {Icon ? <Icon className="size-4" /> : null}
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground">v1.0.0</div>
      </SidebarFooter>
    </Sidebar>
  );
}

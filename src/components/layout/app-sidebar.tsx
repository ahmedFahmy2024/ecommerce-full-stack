"use client";

import { Command } from "lucide-react";
import { useLocale } from "next-intl";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { getDirection } from "@/lib/direction";

/**
 * Minimal sidebar (remediation T16).
 *
 * Previous implementation rendered `menusConfig.sidebarNav` filtered by
 * `getMyPermissions()` (which called the non-existent `GET /users/:id/permissions`).
 * Navigation T22 will reintroduce permission-aware menus once a real permission
 * source (`GET /auth/me` or a new endpoint) exists.
 *
 * Until then the sidebar shows only generic placeholders and does not depend on
 * any auth state. No `filterSidebarGroups`, no `menusConfig`, no `routes`.
 */
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const locale = useLocale();
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
                  <span className="truncate font-semibold">{siteConfig.name}</span>
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
        <div className="p-4 text-sm text-muted-foreground">
          Navigation will be rebuilt in T22 once a real permission model exists.
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground">v1.0.0-template</div>
      </SidebarFooter>
    </Sidebar>
  );
}

"use client";

import {
  ChevronRight,
  Command,
  KeyRound,
  LogIn,
  RefreshCcw,
  UserPlus,
} from "lucide-react";
import type { Session } from "next-auth";
import type * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  filterSidebarGroups,
  type SidebarGroup as SidebarGroupShape,
} from "@/config/filter-menus";
import { type MenuItemProps, menusConfig } from "@/config/menus";
import { siteConfig } from "@/config/site";
import { routes } from "@/constants/routes";
import { Link, usePathname } from "@/i18n/navigation";
import { getDirection } from "@/lib/direction";

export function AppSidebar({
  session,
  permissions,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session | null;
  permissions: string[];
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Common.sidebar");
  const side = getDirection(locale) === "rtl" ? "right" : "left";
  const visibleGroups = filterSidebarGroups(
    menusConfig.sidebarNav as readonly SidebarGroupShape[],
    new Set(permissions),
  );

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
                    {t("adminDashboard")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{t(group.title as any)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(group.items as unknown as MenuItemProps[]).map((item) => {
                  const hasChildren = item.items && item.items.length > 0;

                  if (hasChildren) {
                    return (
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={
                          item.href ? pathname.startsWith(item.href) : false
                        }
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={t(item.title as any)}>
                              {item.icon && <item.icon />}
                              <span>{t(item.title as any)}</span>
                              <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180 rtl:group-data-[state=open]/collapsible:-rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items?.map((subItem: MenuItemProps) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === subItem.href}
                                  >
                                    <Link href={subItem.href || "#"}>
                                      <span>{t(subItem.title as any)}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={t(item.title as any)}
                      >
                        <Link href={item.href || "#"}>
                          {item.icon && <item.icon />}
                          <span>{t(item.title as any)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel>{t("authentication")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!session ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === routes.auth.login}
                    >
                      <Link href={routes.auth.login}>
                        <LogIn />
                        <span>{t("login")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === routes.auth.register}
                    >
                      <Link href={routes.auth.register}>
                        <UserPlus />
                        <span>{t("register")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === routes.auth.forgotPassword}
                    >
                      <Link href={routes.auth.forgotPassword}>
                        <KeyRound />
                        <span>{t("forgotPassword")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === routes.auth.resetPassword}
                    >
                      <Link href={routes.auth.resetPassword}>
                        <RefreshCcw />
                        <span>{t("resetPassword")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                  <LogoutButton
                    displayName={
                      session.user?.name || session.user?.email || ""
                    }
                  />
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground">v1.0.0-template</div>
      </SidebarFooter>
    </Sidebar>
  );
}

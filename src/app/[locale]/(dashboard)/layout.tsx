import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NoAccess } from "@/components/layout/no-access";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MY_PERMISSIONS_QUERY_KEY } from "@/lib/authz";
import { getMyPermissions } from "@/lib/authz/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, t, permissions] = await Promise.all([
    auth(),
    getTranslations("Common.nav"),
    getMyPermissions(),
  ]);

  // Seed the client React Query cache so useMyPermissions resolves
  // synchronously on first paint — no extra round-trip on the client.
  const queryClient = new QueryClient();
  const permissionsArray = Array.from(permissions);
  queryClient.setQueryData(MY_PERMISSIONS_QUERY_KEY, permissionsArray);

  const hasNoAccess = permissions.size === 0;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <AppSidebar session={session} permissions={permissionsArray} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ms-1" />
            <Separator orientation="vertical" className="me-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">{t("dashboard")}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t("currentPage")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ms-auto flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            {hasNoAccess ? <NoAccess /> : children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}

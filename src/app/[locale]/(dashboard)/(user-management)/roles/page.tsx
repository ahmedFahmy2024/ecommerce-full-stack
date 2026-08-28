import { getTranslations } from "next-intl/server";
import type { SearchParams } from "nuqs/server";
import * as React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/constants/routes";
import {
  RolesTable,
  RolesTableFallback,
} from "@/features/roles/components/roles-table";
import { rolesSearchParamsCache } from "@/features/roles/schemas";
import type { Role } from "@/features/roles/types";
import { Link } from "@/i18n/navigation";
import { gateCrudListPage } from "@/lib/authz/crud-page";
import { CRUD } from "@/lib/authz/permissions";
import { buildTableQuery } from "@/lib/table-query";
import apiClient from "@/services/api";
import { ROLES } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";

interface RolesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const { actions } = await gateCrudListPage(
    { ...CRUD.ROLE, view: undefined },
    { viewMode: undefined },
  );
  const search = await rolesSearchParamsCache.parse(await searchParams);
  const t = await getTranslations("Roles");

  const query = buildTableQuery({
    page: search.page,
    limit: search.limit,
    sort: search.sort,
    search: search.search,
    guardName: search.guardName,
  });

  const promises = Promise.all([
    apiClient<PaginatedResponse<Role>>(ROLES, { query }).then(
      (res) => res.data,
    ),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title={t("title")}>
        {actions.create && (
          <Button asChild size="sm">
            <Link href={routes.roles.create}>{t("actions.create")}</Link>
          </Button>
        )}
      </PageHeader>
      <React.Suspense
        key={JSON.stringify(query)}
        fallback={<RolesTableFallback />}
      >
        <RolesTable promises={promises} actions={actions} />
      </React.Suspense>
    </div>
  );
}

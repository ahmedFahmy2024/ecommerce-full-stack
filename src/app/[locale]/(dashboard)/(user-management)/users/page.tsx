import type { SearchParams } from "nuqs/server";
import * as React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/constants/routes";
import {
  UsersTable,
  UsersTableFallback,
} from "@/features/users/components/users-table";
import { usersSearchParamsCache } from "@/features/users/schemas";
import type { User } from "@/features/users/types";
import { Link } from "@/i18n/navigation";
import { gateCrudListPage } from "@/lib/authz/crud-page";
import { CRUD } from "@/lib/authz/permissions";
import { buildTableQuery } from "@/lib/table-query";
import apiClient from "@/services/api";
import { USERS } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/pagination";

interface UsersPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { actions } = await gateCrudListPage(CRUD.USER);
  const search = await usersSearchParamsCache.parse(await searchParams);

  const query = buildTableQuery(
    {
      page: search.page,
      limit: search.limit,
      sort: search.sort,
      search: search.search,
      status: search.status,
      gender: search.gender,
    },
    {
      topLevelKeys: [
        ...(search.onlyWithoutParent === "true" ? ["onlyWithoutParent"] : []),
        ...(search.onlyChildren === "true" ? ["onlyChildren"] : []),
      ],
    },
  );

  if (search.onlyWithoutParent === "true") query.onlyWithoutParent = true;
  if (search.onlyChildren === "true") query.onlyChildren = true;

  const promises = Promise.all([
    apiClient<PaginatedResponse<User>>(USERS, { query }).then(
      (res) => res.data,
    ),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Users">
        {/* Only show the header Create button when createMode is "page" */}
        {actions.create && actions.createMode !== "drawer" && (
          <Button asChild size="sm">
            <Link href={routes.users.create}>Create User</Link>
          </Button>
        )}
      </PageHeader>
      <React.Suspense
        key={JSON.stringify(query)}
        fallback={<UsersTableFallback />}
      >
        <UsersTable promises={promises} actions={actions} />
      </React.Suspense>
    </div>
  );
}

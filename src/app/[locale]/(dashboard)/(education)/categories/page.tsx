import type { SearchParams } from "nuqs/server";
import * as React from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  CategoriesTable,
  CategoriesTableFallback,
} from "@/features/categories/components/categories-table";
import { categoriesSearchParamsCache } from "@/features/categories/schemas";
import type { Category } from "@/features/categories/types";
import { gateCrudListPage } from "@/lib/authz/crud-page";
import { CRUD } from "@/lib/authz/permissions";
import { buildTableQuery } from "@/lib/table-query";
import apiClient from "@/services/api";
import { CATEGORIES } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/pagination";

interface CategoriesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const { actions } = await gateCrudListPage(CRUD.CATEGORY, {
    createMode: "drawer",
    editMode: "drawer",
    viewMode: "drawer",
  });
  const search = await categoriesSearchParamsCache.parse(await searchParams);

  const query = buildTableQuery(
    {
      page: search.page,
      limit: search.limit,
      sort: search.sort,
      search: search.search,
      status: search.status,
    },
    { topLevelKeys: ["status"] },
  );

  const promise = apiClient<PaginatedResponse<Category>>(CATEGORIES, {
    query,
  }).then((res) => res.data);

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Categories" />
      <React.Suspense
        key={JSON.stringify(query)}
        fallback={<CategoriesTableFallback />}
      >
        <CategoriesTable promise={promise} actions={actions} />
      </React.Suspense>
    </div>
  );
}

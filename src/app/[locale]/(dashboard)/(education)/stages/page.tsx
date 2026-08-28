import type { SearchParams } from "nuqs/server";
import * as React from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  StagesTable,
  StagesTableFallback,
} from "@/features/stages/components/stages-table";
import { stagesSearchParamsCache } from "@/features/stages/schemas";
import type { Stage } from "@/features/stages/types";
import { gateCrudListPage } from "@/lib/authz/crud-page";
import { CRUD } from "@/lib/authz/permissions";
import { buildTableQuery } from "@/lib/table-query";
import apiClient from "@/services/api";
import { STAGES } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";

interface StagesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function StagesPage({ searchParams }: StagesPageProps) {
  const { actions } = await gateCrudListPage(CRUD.STAGE, {
    createMode: "drawer",
    editMode: "drawer",
    viewMode: "drawer",
  });
  const search = await stagesSearchParamsCache.parse(await searchParams);

  const query = buildTableQuery(
    {
      page: search.page,
      limit: search.limit,
      sort: search.sort,
      search: search.search,
      status: search.status,
      category_id: search.category_id,
    },
    { topLevelKeys: ["status", "category_id"] },
  );

  const promise = apiClient<PaginatedResponse<Stage>>(STAGES, {
    query,
  }).then((res) => res.data);

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Stages" />
      <React.Suspense
        key={JSON.stringify(query)}
        fallback={<StagesTableFallback />}
      >
        <StagesTable promise={promise} actions={actions} />
      </React.Suspense>
    </div>
  );
}

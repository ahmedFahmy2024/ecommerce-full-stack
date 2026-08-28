import type { SearchParams } from "nuqs/server";
import * as React from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  BatchesTable,
  BatchesTableFallback,
} from "@/features/batches/components/batches-table";
import { batchesSearchParamsCache } from "@/features/batches/schemas";
import type { Batch } from "@/features/batches/types";
import { gateCrudListPage } from "@/lib/authz/crud-page";
import { CRUD } from "@/lib/authz/permissions";
import { buildTableQuery } from "@/lib/table-query";
import apiClient from "@/services/api";
import { BATCHES } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/pagination";

interface BatchesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BatchesPage({ searchParams }: BatchesPageProps) {
  const { actions } = await gateCrudListPage(CRUD.BATCH, {
    createMode: "drawer",
    editMode: "drawer",
    viewMode: "drawer",
  });
  const search = await batchesSearchParamsCache.parse(await searchParams);

  const query = buildTableQuery(
    {
      page: search.page,
      limit: search.limit,
      sort: search.sort,
      search: search.search,
      status: search.status,
      category_id: search.category_id,
      stage_id: search.stage_id,
    },
    { topLevelKeys: ["category_id", "stage_id"] },
  );

  const promise = apiClient<PaginatedResponse<Batch>>(BATCHES, {
    query,
  }).then((res) => res.data);

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Batches" />
      <React.Suspense
        key={JSON.stringify(query)}
        fallback={<BatchesTableFallback />}
      >
        <BatchesTable promise={promise} actions={actions} />
      </React.Suspense>
    </div>
  );
}

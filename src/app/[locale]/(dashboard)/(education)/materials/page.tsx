import type { SearchParams } from "nuqs/server";
import * as React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/constants/routes";
import {
  MaterialsTable,
  MaterialsTableFallback,
} from "@/features/materials/components/materials-table";
import { materialsSearchParamsCache } from "@/features/materials/schemas";
import type { Material } from "@/features/materials/types";
import { Link } from "@/i18n/navigation";
import { gateCrudListPage } from "@/lib/authz/crud-page";
import { CRUD } from "@/lib/authz/permissions";
import { buildTableQuery } from "@/lib/table-query";
import apiClient from "@/services/api";
import { MATERIALS } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/pagination";

interface MaterialsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function MaterialsPage({
  searchParams,
}: MaterialsPageProps) {
  const { actions } = await gateCrudListPage(CRUD.MATERIAL);
  const search = await materialsSearchParamsCache.parse(await searchParams);

  const query = buildTableQuery(
    {
      page: search.page,
      limit: search.limit,
      sort: search.sort,
      search: search.search,
      class_id: search.class_id,
      batch_id: search.batch_id,
      stage_id: search.stage_id,
      supervisor_id: search.supervisor_id,
      material_type: search.material_type,
      material_detail_type: search.material_detail_type,
    },
    {
      topLevelKeys: [
        "class_id",
        "batch_id",
        "stage_id",
        "supervisor_id",
        "material_type",
        "material_detail_type",
      ],
    },
  );

  const promise = apiClient<PaginatedResponse<Material>>(MATERIALS, {
    query,
  }).then((res) => res.data);

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Materials">
        {actions.create && actions.createMode !== "drawer" && (
          <Button asChild size="sm">
            <Link href={routes.materials.create}>Create Material</Link>
          </Button>
        )}
      </PageHeader>
      <React.Suspense
        key={JSON.stringify(query)}
        fallback={<MaterialsTableFallback />}
      >
        <MaterialsTable promise={promise} actions={actions} />
      </React.Suspense>
    </div>
  );
}

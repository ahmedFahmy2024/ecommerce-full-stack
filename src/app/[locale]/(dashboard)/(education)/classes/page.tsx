import type { SearchParams } from "nuqs/server";
import * as React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/constants/routes";
import {
  ClassesTable,
  ClassesTableFallback,
} from "@/features/classes/components/classes-table";
import { classesSearchParamsCache } from "@/features/classes/schemas";
import type { Class } from "@/features/classes/types";
import { Link } from "@/i18n/navigation";
import { gateCrudListPage } from "@/lib/authz/crud-page";
import { CRUD } from "@/lib/authz/permissions";
import { serializeSort } from "@/lib/parsers";
import apiClient from "@/services/api";
import { CLASSES } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/pagination";

interface ClassesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const { actions } = await gateCrudListPage(CRUD.CLASS, {
    createMode: "drawer",
    editMode: "drawer",
    viewMode: "page",
  });
  const search = await classesSearchParamsCache.parse(await searchParams);

  const serializedSort = serializeSort(search.sort);

  const filters: Record<string, string | string[]> = {};
  if (search.status.length > 0) {
    filters["status[in]"] = search.status;
  }
  if (search.gender.length > 0) {
    filters["gender[in]"] = search.gender;
  }
  if (search.materialId) {
    filters.material_id = search.materialId;
  }

  const query: Record<string, string | string[] | number | boolean> = {
    page: search.page,
    limit: search.limit,
    ...(serializedSort && { sort: serializedSort }),
    ...(search.search && { search: search.search }),
    ...(Object.keys(filters).length > 0 && {
      filters: JSON.stringify(filters),
    }),
  };

  const promise = apiClient<PaginatedResponse<Class>>(CLASSES, { query }).then(
    (res) => res.data,
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Classes">
        {/* Only show the header Create button when createMode is "page" */}
        {actions.create && actions.createMode !== "drawer" && (
          <Button asChild size="sm">
            <Link href={routes.classes.create}>Create Class</Link>
          </Button>
        )}
      </PageHeader>
      <React.Suspense
        key={JSON.stringify(query)}
        fallback={<ClassesTableFallback />}
      >
        <ClassesTable promise={promise} actions={actions} />
      </React.Suspense>
    </div>
  );
}

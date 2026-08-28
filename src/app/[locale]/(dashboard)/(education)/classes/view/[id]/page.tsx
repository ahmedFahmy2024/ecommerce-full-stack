import { getTranslations } from "next-intl/server";
import type { SearchParams } from "nuqs/server";
import * as React from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  UsersInClassTable,
  UsersInClassTableFallback,
} from "@/features/classes/components/users-in-class-table";
import {
  SortOrderEnum,
  usersInClassSearchParamsCache,
} from "@/features/classes/schemas/users-in-class";
import type { UserInClass } from "@/features/classes/types/users-in-class";
import { buildTableQuery } from "@/lib/table-query";
import apiClient from "@/services/api";
import { CLASSES_BELONG_USERS } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";

interface ViewClassPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function ViewClassPage({
  params,
  searchParams,
}: ViewClassPageProps) {
  const { id } = await params;
  const search = await usersInClassSearchParamsCache.parse(await searchParams);
  const t = await getTranslations("Classes");

  const query = buildTableQuery(
    {
      page: search.page,
      limit: search.limit,
      sort: search.sort,
      search: search.search,
      // All advanced filter params are top-level (not JSON-wrapped)
      ...(search.sortOrder !== SortOrderEnum.ALPHABETICAL && {
        sortOrder: search.sortOrder,
      }),
      material_id: search.material_id,
      minSuccessCount: search.minSuccessCount ?? undefined,
      maxSuccessCount: search.maxSuccessCount ?? undefined,
      minAttendanceCount: search.minAttendanceCount ?? undefined,
      maxAttendanceCount: search.maxAttendanceCount ?? undefined,
      minSuccessRate: search.minSuccessRate ?? undefined,
      maxSuccessRate: search.maxSuccessRate ?? undefined,
      minCompletionRate: search.minCompletionRate ?? undefined,
      maxCompletionRate: search.maxCompletionRate ?? undefined,
      hasNotTakenAnyQuiz: search.hasNotTakenAnyQuiz ?? undefined,
      onlyPassed: search.onlyPassed ?? undefined,
      onlyFailed: search.onlyFailed ?? undefined,
      lastExamBefore: search.lastExamBefore,
      lastExamAfter: search.lastExamAfter,
      examDateFrom: search.examDateFrom,
      examDateTo: search.examDateTo,
      notExaminedSince: search.notExaminedSince,
    },
    {
      topLevelKeys: [
        "sortOrder",
        "material_id",
        "minSuccessCount",
        "maxSuccessCount",
        "minAttendanceCount",
        "maxAttendanceCount",
        "minSuccessRate",
        "maxSuccessRate",
        "minCompletionRate",
        "maxCompletionRate",
        "hasNotTakenAnyQuiz",
        "onlyPassed",
        "onlyFailed",
        "lastExamBefore",
        "lastExamAfter",
        "examDateFrom",
        "examDateTo",
        "notExaminedSince",
      ],
    },
  );

  const promise = apiClient<PaginatedResponse<UserInClass>>(
    CLASSES_BELONG_USERS,
    {
      params: { id },
      query,
    },
  ).then((res) => res.data);

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title={t("usersInClass.title")} />
      <React.Suspense
        key={JSON.stringify({ id, ...query })}
        fallback={<UsersInClassTableFallback />}
      >
        <UsersInClassTable classId={id} promise={promise} />
      </React.Suspense>
    </div>
  );
}

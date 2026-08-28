"use client";

import { useTranslations } from "next-intl";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { FeatureTableShell } from "@/components/data-table/feature-table-shell";
import { useAdvancedFiltersActive } from "@/hooks/use-advanced-filters-active";
import type { PaginatedResponse } from "@/types/pagination";
import { SortOrderEnum } from "../schemas/users-in-class";
import type { UserInClass } from "../types/users-in-class";
import { UsersInClassFilterSheet } from "./users-in-class-filter-sheet";
import { getUsersInClassColumns } from "./users-in-class-table-columns";

interface UsersInClassTableProps {
  classId: string;
  promise: Promise<PaginatedResponse<UserInClass>>;
}

const ADVANCED_FILTER_DEFAULTS = {
  sortOrder: SortOrderEnum.ALPHABETICAL,
  material_id: "",
  minSuccessCount: null as number | null,
  maxSuccessCount: null as number | null,
  minAttendanceCount: null as number | null,
  maxAttendanceCount: null as number | null,
  minSuccessRate: null as number | null,
  maxSuccessRate: null as number | null,
  minCompletionRate: null as number | null,
  maxCompletionRate: null as number | null,
  hasNotTakenAnyQuiz: null as boolean | null,
  onlyPassed: null as boolean | null,
  onlyFailed: null as boolean | null,
  lastExamBefore: "",
  lastExamAfter: "",
  examDateFrom: "",
  examDateTo: "",
  notExaminedSince: "",
};

export function UsersInClassTable({
  classId,
  promise,
}: UsersInClassTableProps) {
  "use no memo";
  const t = useTranslations("Classes");
  const { items, meta } = React.use(promise);

  const columns = React.useMemo(() => getUsersInClassColumns(t), [t]);

  const [urlSortOrder, setUrlSortOrder] = useQueryStates(
    {
      sortOrder: parseAsStringEnum<SortOrderEnum>(
        Object.values(SortOrderEnum),
      ).withDefault(SortOrderEnum.ALPHABETICAL),
    },
    { shallow: false, clearOnDefault: true },
  );
  const [urlNumbers, setUrlNumbers] = useQueryStates(
    {
      minSuccessCount: parseAsInteger,
      maxSuccessCount: parseAsInteger,
      minAttendanceCount: parseAsInteger,
      maxAttendanceCount: parseAsInteger,
      minSuccessRate: parseAsInteger,
      maxSuccessRate: parseAsInteger,
      minCompletionRate: parseAsInteger,
      maxCompletionRate: parseAsInteger,
    },
    { shallow: false, clearOnDefault: true },
  );
  const [urlBooleans, setUrlBooleans] = useQueryStates(
    {
      hasNotTakenAnyQuiz: parseAsBoolean,
      onlyPassed: parseAsBoolean,
      onlyFailed: parseAsBoolean,
    },
    { shallow: false, clearOnDefault: true },
  );
  const [urlDates, setUrlDates] = useQueryStates(
    {
      lastExamBefore: parseAsString.withDefault(""),
      lastExamAfter: parseAsString.withDefault(""),
      examDateFrom: parseAsString.withDefault(""),
      examDateTo: parseAsString.withDefault(""),
      notExaminedSince: parseAsString.withDefault(""),
    },
    { shallow: false, clearOnDefault: true },
  );
  const [urlMaterialId, setUrlMaterialId] = useQueryState(
    "material_id",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, clearOnDefault: true }),
  );

  const currentValues = {
    ...urlSortOrder,
    material_id: urlMaterialId,
    ...urlNumbers,
    ...urlBooleans,
    ...urlDates,
  };

  const advancedActive = useAdvancedFiltersActive(
    currentValues,
    ADVANCED_FILTER_DEFAULTS,
  );

  const onExtraReset = React.useCallback(() => {
    setUrlSortOrder({ sortOrder: SortOrderEnum.ALPHABETICAL });
    setUrlMaterialId("");
    setUrlNumbers({
      minSuccessCount: null,
      maxSuccessCount: null,
      minAttendanceCount: null,
      maxAttendanceCount: null,
      minSuccessRate: null,
      maxSuccessRate: null,
      minCompletionRate: null,
      maxCompletionRate: null,
    });
    setUrlBooleans({
      hasNotTakenAnyQuiz: null,
      onlyPassed: null,
      onlyFailed: null,
    });
    setUrlDates({
      lastExamBefore: "",
      lastExamAfter: "",
      examDateFrom: "",
      examDateTo: "",
      notExaminedSince: "",
    });
  }, [
    setUrlSortOrder,
    setUrlMaterialId,
    setUrlNumbers,
    setUrlBooleans,
    setUrlDates,
  ]);

  const filterLabels = {
    title: t("usersInClass.filters.advancedFilters"),
    apply: t("usersInClass.filters.apply"),
    reset: t("usersInClass.filters.reset"),
    sortOrder: t("usersInClass.filters.sortOrder"),
    sortOrderOptions: {
      [SortOrderEnum.ALPHABETICAL]: t(
        "usersInClass.filters.sortOrderOptions.alphabetical",
      ),
      [SortOrderEnum.MOST_SUCCESSFUL]: t(
        "usersInClass.filters.sortOrderOptions.mostSuccessful",
      ),
      [SortOrderEnum.LEAST_SUCCESSFUL]: t(
        "usersInClass.filters.sortOrderOptions.leastSuccessful",
      ),
      [SortOrderEnum.MOST_ATTENDANCE]: t(
        "usersInClass.filters.sortOrderOptions.mostAttendance",
      ),
      [SortOrderEnum.LEAST_ATTENDANCE]: t(
        "usersInClass.filters.sortOrderOptions.leastAttendance",
      ),
    },
    materialId: t("usersInClass.filters.materialId"),
    minSuccessCount: t("usersInClass.filters.minSuccessCount"),
    maxSuccessCount: t("usersInClass.filters.maxSuccessCount"),
    minAttendanceCount: t("usersInClass.filters.minAttendanceCount"),
    maxAttendanceCount: t("usersInClass.filters.maxAttendanceCount"),
    minSuccessRate: t("usersInClass.filters.minSuccessRate"),
    maxSuccessRate: t("usersInClass.filters.maxSuccessRate"),
    minCompletionRate: t("usersInClass.filters.minCompletionRate"),
    maxCompletionRate: t("usersInClass.filters.maxCompletionRate"),
    hasNotTakenAnyQuiz: t("usersInClass.filters.hasNotTakenAnyQuiz"),
    onlyPassed: t("usersInClass.filters.onlyPassed"),
    onlyFailed: t("usersInClass.filters.onlyFailed"),
    lastExamBefore: t("usersInClass.filters.lastExamBefore"),
    lastExamAfter: t("usersInClass.filters.lastExamAfter"),
    examDateFrom: t("usersInClass.filters.examDateFrom"),
    examDateTo: t("usersInClass.filters.examDateTo"),
    notExaminedSince: t("usersInClass.filters.notExaminedSince"),
    sections: {
      sorting: t("usersInClass.filters.sections.sorting"),
      success: t("usersInClass.filters.sections.success"),
      attendance: t("usersInClass.filters.sections.attendance"),
      dates: t("usersInClass.filters.sections.dates"),
    },
  };

  return (
    <FeatureTableShell
      data={items}
      pageCount={meta.totalPages}
      columns={columns}
      isExtraFiltered={advancedActive}
      onExtraReset={onExtraReset}
      initialState={{ columnPinning: { right: [] } }}
      toolbarExtras={() => (
        <UsersInClassFilterSheet classId={classId} labels={filterLabels} />
      )}
    />
  );
}

export function UsersInClassTableFallback() {
  return (
    <DataTableSkeleton
      columnCount={8}
      rowCount={10}
      filterCount={1}
      withViewOptions
      withPagination
    />
  );
}

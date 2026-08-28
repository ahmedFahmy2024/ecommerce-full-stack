import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { getSortingStateParser } from "@/lib/parsers";
import type { UserInClass } from "../types/users-in-class";

export enum SortOrderEnum {
  ALPHABETICAL = "alphabetical",
  MOST_SUCCESSFUL = "mostSuccessful",
  LEAST_SUCCESSFUL = "leastSuccessful",
  MOST_ATTENDANCE = "mostAttendance",
  LEAST_ATTENDANCE = "leastAttendance",
}

export const usersInClassSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<UserInClass>().withDefault([]),
  search: parseAsString.withDefault(""),

  sortOrder: parseAsStringEnum<SortOrderEnum>(
    Object.values(SortOrderEnum),
  ).withDefault(SortOrderEnum.ALPHABETICAL),

  material_id: parseAsString.withDefault(""),

  minSuccessCount: parseAsInteger,
  maxSuccessCount: parseAsInteger,
  minAttendanceCount: parseAsInteger,
  maxAttendanceCount: parseAsInteger,

  minSuccessRate: parseAsInteger,
  maxSuccessRate: parseAsInteger,
  minCompletionRate: parseAsInteger,
  maxCompletionRate: parseAsInteger,

  hasNotTakenAnyQuiz: parseAsBoolean,
  onlyPassed: parseAsBoolean,
  onlyFailed: parseAsBoolean,

  lastExamBefore: parseAsString.withDefault(""),
  lastExamAfter: parseAsString.withDefault(""),
  examDateFrom: parseAsString.withDefault(""),
  examDateTo: parseAsString.withDefault(""),
  notExaminedSince: parseAsString.withDefault(""),
});

export type UsersInClassSearchParams = Awaited<
  ReturnType<typeof usersInClassSearchParamsCache.parse>
>;

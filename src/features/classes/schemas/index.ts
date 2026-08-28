import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { baseTableParsers } from "@/lib/search-params";
import type { Class } from "../types";

export const classesSearchParamsCache = createSearchParamsCache({
  ...baseTableParsers<Class>(),
  status: parseAsArrayOf(
    parseAsStringEnum([
      "active",
      "not_active",
      "deleted",
      "pending",
      "finished",
    ]),
  ).withDefault([]),
  gender: parseAsArrayOf(
    parseAsStringEnum(["male", "female", "both"]),
  ).withDefault([]),
  materialId: parseAsString.withDefault(""),
});

export type ClassesSearchParams = Awaited<
  ReturnType<typeof classesSearchParamsCache.parse>
>;

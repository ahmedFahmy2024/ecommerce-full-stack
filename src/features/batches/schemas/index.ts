import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { baseTableParsers } from "@/lib/search-params";
import type { Batch } from "../types";

export const batchesSearchParamsCache = createSearchParamsCache({
  ...baseTableParsers<Batch>(),
  status: parseAsArrayOf(
    parseAsStringEnum(["active", "inactive", "deleted", "pending", "finished"]),
  ).withDefault([]),
  category_id: parseAsString.withDefault(""),
  stage_id: parseAsString.withDefault(""),
});

export type BatchesSearchParams = Awaited<
  ReturnType<typeof batchesSearchParamsCache.parse>
>;

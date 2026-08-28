import { createSearchParamsCache, parseAsStringEnum } from "nuqs/server";

import { baseTableParsers } from "@/lib/search-params";
import type { Category } from "../types";

export const categoriesSearchParamsCache = createSearchParamsCache({
  ...baseTableParsers<Category>(),
  status: parseAsStringEnum(["active", "inactive"]).withDefault(
    null as unknown as "active",
  ),
});

export type CategoriesSearchParams = Awaited<
  ReturnType<typeof categoriesSearchParamsCache.parse>
>;

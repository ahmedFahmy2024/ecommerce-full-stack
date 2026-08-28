import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { baseTableParsers } from "@/lib/search-params";
import type { Stage } from "../types";

export const stagesSearchParamsCache = createSearchParamsCache({
  ...baseTableParsers<Stage>(),
  status: parseAsStringEnum(["active", "not_active"]).withDefault(
    null as unknown as "active",
  ),
  category_id: parseAsString.withDefault(""),
});

export type StagesSearchParams = Awaited<
  ReturnType<typeof stagesSearchParamsCache.parse>
>;

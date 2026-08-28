import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { baseTableParsers } from "@/lib/search-params";
import type { Material } from "../types";

export const materialsSearchParamsCache = createSearchParamsCache({
  ...baseTableParsers<Material>(),
  material_type: parseAsStringEnum([
    "subject",
    "community",
    "quran",
  ]).withDefault(null as unknown as "subject"),
  material_detail_type: parseAsStringEnum([
    "live",
    "recorded",
    "recorded_limit",
    "both",
    "presence",
  ]).withDefault(null as unknown as "live"),
  class_id: parseAsString.withDefault(""),
  batch_id: parseAsString.withDefault(""),
  stage_id: parseAsString.withDefault(""),
  supervisor_id: parseAsString.withDefault(""),
});

export type MaterialsSearchParams = Awaited<
  ReturnType<typeof materialsSearchParamsCache.parse>
>;

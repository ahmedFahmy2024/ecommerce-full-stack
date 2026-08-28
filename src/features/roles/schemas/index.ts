import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { baseTableParsers } from "@/lib/search-params";
import type { Role } from "../types";

export const rolesSearchParamsCache = createSearchParamsCache({
  ...baseTableParsers<Role>(),
  guardName: parseAsArrayOf(parseAsStringEnum(["admin", "user"])).withDefault(
    [],
  ),
});

export type RolesSearchParams = Awaited<
  ReturnType<typeof rolesSearchParamsCache.parse>
>;

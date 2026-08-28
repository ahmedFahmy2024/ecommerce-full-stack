import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { baseTableParsers } from "@/lib/search-params";
import type { User } from "../types";

export const usersSearchParamsCache = createSearchParamsCache({
  ...baseTableParsers<User>(),
  status: parseAsArrayOf(
    parseAsStringEnum(["active", "inactive", "banned"]),
  ).withDefault([]),
  gender: parseAsArrayOf(parseAsStringEnum(["male", "female"])).withDefault([]),
  onlyWithoutParent: parseAsString.withDefault(""),
  onlyChildren: parseAsString.withDefault(""),
});

export type UsersSearchParams = Awaited<
  ReturnType<typeof usersSearchParamsCache.parse>
>;

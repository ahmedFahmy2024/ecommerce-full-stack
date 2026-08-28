import { parseAsInteger, parseAsString } from "nuqs/server";

import { getSortingStateParser } from "@/lib/parsers";

export function baseTableParsers<TRow>() {
  return {
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<TRow>().withDefault([]),
    search: parseAsString.withDefault(""),
  };
}

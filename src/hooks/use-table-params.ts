import {
  parseAsInteger,
  parseAsString,
  parseAsJson,
  createSerializer,
} from "nuqs";
import type { ColumnFiltersState } from "@tanstack/react-table";

export const tableParamsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  sort: parseAsString.withDefault("createdAt.desc"),
  filters: parseAsJson<ColumnFiltersState>(
    (value) => value as ColumnFiltersState,
  ).withDefault([]),
};

export const serializeTableParams = createSerializer(tableParamsParsers);

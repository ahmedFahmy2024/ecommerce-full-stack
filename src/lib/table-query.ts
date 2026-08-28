import { serializeSort } from "@/lib/parsers";
import type { ExtendedColumnSort } from "@/types/data-table";

interface BuildTableQueryOptions {
  /**
   * Keys that should be passed directly as top-level query params instead of
   * being JSON-wrapped inside a `filters` envelope. `page`, `limit`, `sort`,
   * and `search` are always top-level regardless of this option.
   */
  topLevelKeys?: string[];
  /**
   * Suffix appended to array-valued filter keys. Defaults to `[in]`.
   * e.g. `status` with values `["active","inactive"]` becomes
   * `{ "status[in]": ["active","inactive"] }` inside the filters JSON.
   */
  arrayFilterSuffix?: string;
}

type ScalarParam = string | string[] | number | boolean | null | undefined;

type SearchParams<TData> = {
  sort?: ExtendedColumnSort<TData>[];
} & Record<string, ScalarParam | ExtendedColumnSort<TData>[]>;

/**
 * Converts parsed search params into a flat API query object.
 *
 * - `page`, `limit`, `sort`, `search` → always top-level
 * - Array values → JSON-wrapped as `"key<suffix>": value` inside `filters`
 * - Scalar values → JSON-wrapped inside `filters` unless key is in `topLevelKeys`
 * - Falsy / null / undefined values → excluded
 */
export function buildTableQuery<TData = unknown>(
  params: SearchParams<TData>,
  options: BuildTableQueryOptions = {},
): Record<string, string | string[] | number | boolean> {
  const { topLevelKeys = [], arrayFilterSuffix = "[in]" } = options;

  const alwaysTopLevel = new Set(["page", "limit", "search", "sort"]);
  const topLevelSet = new Set(topLevelKeys);

  const result: Record<string, string | string[] | number | boolean> = {};
  const filtersPayload: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(params)) {
    // Skip empty values
    if (value === null || value === undefined) continue;
    if (value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;

    // Special handling for sort
    if (key === "sort") {
      const sortArr = value as ExtendedColumnSort<TData>[];
      if (Array.isArray(sortArr) && sortArr.length > 0) {
        const serialized = serializeSort(sortArr);
        if (serialized) result.sort = serialized;
      }
      continue;
    }

    // Always top-level keys
    if (alwaysTopLevel.has(key)) {
      result[key] = value as string | number | boolean;
      continue;
    }

    // Explicitly top-level keys
    if (topLevelSet.has(key)) {
      result[key] = value as string | number | boolean;
      continue;
    }

    // Array values → wrapped with suffix inside filters JSON
    if (Array.isArray(value)) {
      filtersPayload[`${key}${arrayFilterSuffix}`] = value as string[];
      continue;
    }

    // Scalar filters → inside filters JSON
    filtersPayload[key] = String(value);
  }

  if (Object.keys(filtersPayload).length > 0) {
    result.filters = JSON.stringify(filtersPayload);
  }

  return result;
}

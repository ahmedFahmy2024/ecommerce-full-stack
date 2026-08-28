/**
 * Returns true if any key in `values` differs from its default in `defaults`,
 * excluding pagination/sort keys and any keys listed in `excludeKeys`.
 *
 * Use this to drive the "active filters" badge on an AdvancedFilterSheet trigger
 * without manually listing every param.
 */
export function useAdvancedFiltersActive<T extends Record<string, unknown>>(
  values: T,
  defaults: T,
  excludeKeys: (keyof T)[] = [],
): boolean {
  const excludeSet = new Set<unknown>([
    "page",
    "limit",
    "sort",
    "search",
    ...excludeKeys,
  ]);

  for (const key of Object.keys(values)) {
    if (excludeSet.has(key)) continue;

    const current = values[key];
    const defaultVal = defaults[key];

    if (current === defaultVal) continue;

    // Treat null / undefined / "" / [] as equivalent to "empty"
    const isEmpty = (v: unknown) =>
      v === null ||
      v === undefined ||
      v === "" ||
      (Array.isArray(v) && v.length === 0);

    if (isEmpty(current) && isEmpty(defaultVal)) continue;

    return true;
  }

  return false;
}

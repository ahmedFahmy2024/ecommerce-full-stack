# Filter Enhancement Plan

## Context

The current filtering approach is solid at the column/feature level (co-located `meta` on columns, TanStack Table integration, nuqs URL sync) but has two scaling problems:

1. **No shared API query builder.** Every page server component manually assembles the query object from parsed params. At 30 pages this is 30 diverging implementations. The `users/page.tsx` and `classes/view/[id]/page.tsx` already look different from each other.

2. **No standard pattern for complex filter sheets.** `UsersInClassFilterSheet` is a one-off: custom URL params, custom `advancedActive` calculation, custom query assembly. When the next page needs range/date/enum filters, a new developer will invent a fourth pattern.

The goal is to borrow `zad/`'s API layer discipline while keeping your superior column-collocated filter definitions.

---

## Enhancement Plan

### Phase 1 — Shared API query builder utility

**File to create:** `src/lib/table-query.ts`

Create a `buildTableQuery` function that accepts parsed search params and produces the API query object. It should handle the two formats already in use:

- **Flat filters** (used in `users/page.tsx`): wraps `status`, `gender`, etc. into `filters=JSON` with `[in]` operator syntax: `{ "status[in]": ["active","inactive"] }`
- **Extended params** (used in `classes/view/[id]/page.tsx`): numeric ranges, booleans, dates passed as top-level params

```ts
// Signature
export function buildTableQuery(
  params: Record<string, unknown>,
  options?: {
    topLevelKeys?: string[];   // keys passed directly (not inside filters JSON)
    arrayFilterSuffix?: string; // default "[in]"
  }
): Record<string, string>
```

Rules:
- `page`, `limit`, `sort` → always top-level
- `search` → always top-level
- Array values → JSON-wrapped as `"key[in]": value`
- `topLevelKeys` option → bypass JSON wrapping for named keys (used for range/date/boolean params)
- Empty/default values → excluded from output

**Affected pages after adoption:**
- `src/app/[locale]/(dashboard)/(user-management)/users/page.tsx` — replace manual assembly (lines 20–50)
- `src/app/[locale]/(dashboard)/(education)/classes/view/[id]/page.tsx` — replace manual assembly (lines 30–90)
- All future page server components

---

### Phase 2 — Standard advanced filter sheet abstraction

**File to create:** `src/components/data-table/advanced-filter-sheet.tsx`

Extract the repeated pattern from `UsersInClassFilterSheet` into a composable wrapper. The current sheet is 817 lines because it mixes layout, form state, URL sync, and business logic together.

The abstraction should provide:

```ts
interface AdvancedFilterSheetProps<TParams> {
  cache: ReturnType<typeof createSearchParamsCache>  // nuqs cache
  defaultValues: TParams
  onApply: (values: TParams) => void                 // calls setFilterValues
  children: React.ReactNode                          // filter fields (form inputs)
  triggerLabel?: string
}
```

The wrapper owns: sheet open/close, form state via RHF, apply/reset buttons, and the `advancedActive` badge on the trigger button.

Each feature only needs to supply the inner fields — not re-implement the shell.

**Affected files:**
- `src/features/classes/components/users-in-class-filter-sheet.tsx` — refactor to use the wrapper, strip the sheet/form boilerplate (~400 lines reducible)
- All future filter sheets follow the same pattern

---

### Phase 3 — Standardize `advancedActive` detection

Currently `users-in-class-table.tsx` (lines ~40–80) manually lists every param to check against its default. This will rot as params are added.

**Fix:** Add a `useAdvancedFiltersActive` hook in `src/hooks/use-advanced-filters-active.ts`:

```ts
export function useAdvancedFiltersActive<T extends Record<string, unknown>>(
  values: T,
  defaults: T,
  excludeKeys?: (keyof T)[]  // e.g. ["page", "limit", "sort", "search"]
): boolean
```

Does a shallow comparison of every key against its default, excluding pagination/sort keys. Returns `true` if any filter differs from default.

**Affected files:**
- `src/features/classes/components/users-in-class-table.tsx` — replace lines ~40–80 with single hook call

---

### Phase 4 — Column meta `apiKey` option

Some filters need a different key name when sent to the API (e.g. `search` in URL → `name` on backend, or `materialId` → `material_id`). Currently this is handled ad-hoc in page server components.

**Fix:** Add optional `apiKey` to `ColumnMeta` in `src/types/index.ts` (or wherever column meta types live):

```ts
interface ColumnMeta {
  // ...existing fields
  apiKey?: string  // override the URL param key when building API query
}
```

`buildTableQuery` reads `apiKey` from column definitions when mapping params to API keys — same idea as `zad/`'s `searchParam` field but typed against columns.

---

### Phase 5 — Document the pattern in CLAUDE.md

Add a "Filters" section to `CLAUDE.md` describing:
- Use column `meta.variant` for toolbar filters (text, select, multiSelect, boolean, date, range)
- Use `AdvancedFilterSheet` + `usersInClassSearchParamsCache` pattern for complex per-page filters (ranges, dates, enums)
- Always use `buildTableQuery` in page server components — never assemble query objects by hand
- Use `useAdvancedFiltersActive` for the filter sheet trigger badge

---

## Critical Files

| File | Role |
|------|------|
| `src/lib/table-query.ts` | **New** — shared API query builder |
| `src/components/data-table/advanced-filter-sheet.tsx` | **New** — reusable filter sheet wrapper |
| `src/hooks/use-advanced-filters-active.ts` | **New** — active filter detection hook |
| `src/app/[locale]/(dashboard)/(user-management)/users/page.tsx` | Adopt `buildTableQuery` |
| `src/app/[locale]/(dashboard)/(education)/classes/view/[id]/page.tsx` | Adopt `buildTableQuery` |
| `src/features/classes/components/users-in-class-filter-sheet.tsx` | Refactor to use `AdvancedFilterSheet` |
| `src/features/classes/components/users-in-class-table.tsx` | Adopt `useAdvancedFiltersActive` |
| `src/types/index.ts` (or column meta types file) | Add `apiKey` to `ColumnMeta` |
| `CLAUDE.md` | Document the pattern |

---

## Verification

1. Run `bun run build` — no type errors
2. Run `bun run lint` — no Biome warnings
3. Open `/users` — filters work, URL params update, API receives correct query
4. Open `/classes/view/[id]` — advanced filter sheet applies correctly, `advancedActive` badge appears when filters are non-default
5. Add a new dummy page using only `buildTableQuery` + column `meta` — confirm it takes <30 min with no page-specific query assembly code

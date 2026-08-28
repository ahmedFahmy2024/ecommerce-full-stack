# Table: Filter, Search, Sort & Pagination Integration Guide

This document is the single source of truth for connecting any data table in this
dashboard to the backend. Read it completely before adding or modifying a table.

---

## 1. Backend Contract

### Base URL
All requests go through `apiClient()` → `NEXT_PUBLIC_BACKEND_URL` + endpoint path.

### Standard query parameters the backend accepts

| Param | Type on wire | Example | Notes |
|-------|-------------|---------|-------|
| `page` | number | `1` | 1-based, default 1 |
| `limit` | number | `10` | max 1000, default 10 |
| `search` | string | `ahmed` | Global OR across `searchableFields` defined per endpoint |
| `filters` | JSON string | `{"status[in]":"active,inactive"}` | Must be `JSON.stringify({...})` |
| `sort` | JSON string | `{"createdAt":"DESC"}` | Must be `JSON.stringify({field: "ASC"|"DESC"})` |

### Filter operators

All filter keys inside the `filters` JSON object use the format `{field}[{operator}]`.

| Operator | SQL effect | Value format |
|----------|-----------|-------------|
| `[eq]` | `= value` (or `IS NULL` when value is the string `"null"`) | single string |
| `[ne]` | `!= value` (or `IS NOT NULL`) | single string |
| `[like]` | `ILIKE '%value%'` case-insensitive | single string |
| `[in]` | `IN (a, b, c)` | comma-separated string **or** array |
| `[between]` | `BETWEEN a AND b` | comma-separated pair e.g. `"1700000000000,1710000000000"` |
| `[gt]` / `[gte]` | `>` / `>=` | number or date string |
| `[lt]` / `[lte]` | `<` / `<=` | number or date string |

**Localized fields** (JSONB `{en, ar}`): `[like]` and `[eq]` automatically search both languages.
Examples: `title`, `name`, `description` on entities like Materials, Classes, Quizzes.

**Relation dot-notation**: `"materialDetails.matrial.id[eq]": "uuid"` — backend resolves the join.

**Null check**: pass the string `"null"` as the value with `[eq]` or `[ne]`.

### Sort format

```jsonc
// Single field
sort={"createdAt":"DESC"}

// Multiple fields (applied in order)
sort={"createdAt":"DESC","fullName":"ASC"}
```

`ASC` / `DESC` must be uppercase. Default (when omitted): `createdAt DESC`.

### `search` behavior per endpoint

| Endpoint | Fields searched |
|----------|----------------|
| `GET /users` | `fullName`, `email`, `phone` |
| `GET /materials` | `title` (en+ar), `description` (en+ar) |
| `GET /classes` | `name` (en+ar) |
| `GET /quizzes` | `name` (en+ar) |
| `GET /material_sessions` | `supervisor.fullName`, `instructor.fullName` |

Always verify the backend service's `searchableFields` array when adding a new table.

### Standard paginated response

```ts
{
  items: T[],
  meta: {
    totalItems: number,
    currentPage: number,
    totalPages: number,   // ← drives pageCount in useDataTable
    hasNextPage: boolean,
    hasPreviousPage: boolean,
    limit: number
  },
  links: { first, previous, next, last, current }
}
```

The type is `PaginatedResponse<T>` from `src/types/api.ts`.

---

## 2. Frontend Architecture

### Data flow (read this top-to-bottom for every table)

```
User interacts with toolbar / column header / pagination
        ↓
useDataTable() updates URL via nuqs (shallow=false → triggers RSC re-render)
        ↓
URL search params change
        ↓
Page component (Server Component) re-renders
        ↓
searchParamsCache.parse() converts raw URL strings → typed values
        ↓
page.tsx maps typed values → backend query params
        ↓
apiClient(ENDPOINT, { query }) fetches data
        ↓
Promise passed to <EntityTable promises={promises} />
        ↓
React.use(promises) unwraps data inside Suspense boundary
        ↓
useDataTable() receives { items, meta.totalPages }
        ↓
TanStack Table renders rows
```

### Key files and their responsibilities

| File | Responsibility |
|------|---------------|
| `src/app/[locale]/.../page.tsx` | Parse URL params; build backend query; pass promise to table |
| `src/features/{entity}/schemas/index.ts` | nuqs parsers for every URL param this table uses |
| `src/features/{entity}/types/index.ts` | TypeScript shape of one entity item |
| `src/features/{entity}/components/{entity}-table.tsx` | Unwraps promise; wires `useDataTable`; renders `<DataTable>` |
| `src/features/{entity}/components/{entity}-table-columns.tsx` | Column definitions + filter metadata |
| `src/hooks/use-data-table.ts` | Central hook: syncs TanStack Table state ↔ URL via nuqs |
| `src/components/data-table/data-table-toolbar.tsx` | Renders filter controls from column `meta.variant` |
| `src/services/api/endpoints.ts` | Maps endpoint name → URL + HTTP method |
| `src/services/api/queries.ts` | Endpoint name constants |

---

## 3. URL ↔ Backend Param Mapping Rules

These rules are applied **inside `page.tsx`** for every table.

### 3.1 Sort

The `sort` URL param stores TanStack Table format (JSON array):
```
?sort=[{"id":"createdAt","desc":true}]
```

Convert to backend format in `page.tsx`:

```ts
function serializeSort<T>(sort: ExtendedColumnSort<T>[]): string | undefined {
  if (!sort.length) return undefined;
  const obj: Record<string, string> = {};
  for (const s of sort) {
    obj[s.id] = s.desc ? "DESC" : "ASC";
  }
  return JSON.stringify(obj);
}
```

Pass as: `{ sort: serializeSort(search.sort) }` — omit when undefined.

### 3.2 Text search

Column definition uses `id: "search"` + `meta.variant: "text"`.
This puts the value in `?search=value` on the URL.
Schema reads it as `search: parseAsString.withDefault("")`.
Pass to backend as: `...(search.search && { search: search.search })`.

**Rule:** The column `id` for the global search input must always be `"search"` so it
maps to the `search` URL param and then to `search` query param.

### 3.3 Multi-select filters (`status`, `gender`, roles, etc.)

Column definition uses `meta.variant: "multiSelect"` + `meta.options: [...]`.
`useDataTable` stores selected values as comma-separated string in URL:
```
?status=active,inactive
```
Schema reads it as `parseAsArrayOf(parseAsStringEnum([...]))`.
Backend wants the `[in]` operator:

```ts
if (search.status.length > 0) {
  filters["status[in]"] = search.status; // string[] — apiClient joins with comma
}
```

`apiClient` handles `string[]` values by calling `queryString.append(key, val)` for
each element, but the backend `[in]` filter also accepts a single comma-separated
string. Either works; using `search.status` (array) is correct.

### 3.4 Boolean filters

Column definition uses `meta.variant: "boolean"` and `id: "onlyWithoutParent"` (or similar).
Schema reads as `parseAsString.withDefault("")` — value is `"true"` or `""`.

```ts
// As a top-level param (when backend has a custom handler for it)
...(search.onlyWithoutParent === "true" && { onlyWithoutParent: true })

// As a filter (when backend uses standard filter system)
if (search.onlyWithoutParent === "true") {
  filters["someField[ne]"] = "null";
}
```

Check the actual backend endpoint to know which approach it expects.

### 3.5 Date range filters

Column definition uses `meta.variant: "dateRange"` and `accessorKey: "createdAt"` (or any date field).
`DataTableDateFilter` stores values as **millisecond timestamps** (two numbers):
```
?createdAt=1700000000000,1710000000000
```
`useDataTable` stores these in the URL under the column's id.
Schema reads as `parseAsString.withDefault("")`.

Convert to backend `[between]` in `page.tsx`:

```ts
if (search.createdAt) {
  // value is "timestamp1,timestamp2" — backend between accepts this directly
  filters["createdAt[between]"] = search.createdAt;
}
```

**Important:** the date filter stores Unix timestamps in milliseconds, not ISO strings.
The backend's `[between]` operator compares raw values — confirm the backend column
type accepts timestamp numbers. If the backend expects ISO strings, convert:

```ts
const [from, to] = search.createdAt.split(",");
filters["createdAt[between]"] = [
  new Date(Number(from)).toISOString(),
  new Date(Number(to)).toISOString(),
].join(",");
```

### 3.6 Single-select filters

Column definition uses `meta.variant: "select"`.
`useDataTable` stores a single string in the URL (comma-separated same as multiSelect but user picks one).
Schema reads as `parseAsString.withDefault("")`.

```ts
if (search.someField) {
  filters["someField[eq]"] = search.someField;
}
```

---

## 4. Column Definition Checklist

For each column in `{entity}-table-columns.tsx`:

### `id` field rules

| Situation | Rule |
|-----------|------|
| Global text search column | Always set `id: "search"` regardless of `accessorKey` |
| Boolean filter column | `id` must match the schema key, e.g. `id: "onlyWithoutParent"` |
| All other filterable columns | `id` defaults to `accessorKey` — keep them in sync with schema |
| Non-filterable columns | `id` is optional |

### `enableColumnFilter`

Set to `true` only on columns that have a corresponding filter in the schema and are
sent to the backend. Leaving it `true` without a schema entry causes the URL param to
appear but never be forwarded.

### `meta.variant` → filter UI component mapping

| `variant` | UI rendered | URL value format | Backend operator |
|-----------|-------------|-----------------|-----------------|
| `"text"` | Text input (debounced 500ms) | plain string | `search` param (not `filters`) |
| `"select"` | Dropdown single-select | single string | `[eq]` |
| `"multiSelect"` | Faceted filter multi-select | comma-separated | `[in]` |
| `"boolean"` | Toggle / checkbox | `"true"` or `""` | `[eq]`, `[ne]`, or custom param |
| `"date"` | Single date picker | ms timestamp | `[eq]`, `[gte]`, `[lte]` |
| `"dateRange"` | Date range picker | `"ms1,ms2"` | `[between]` |
| `"number"` | Number input | number string | `[eq]` usually |
| `"range"` | Slider | `"min,max"` | `[between]` |

### `enableSorting`

Set to `false` on columns that do not correspond to a real database column (e.g. computed
fields, relation arrays). The backend `sort` object only accepts direct entity fields.

---

## 5. Schema (`schemas/index.ts`) Checklist

Every URL param that `useDataTable` writes must have a matching parser in the schema.
If it is missing, the Server Component never sees the value and the backend never receives it.

```ts
export const {entity}SearchParamsCache = createSearchParamsCache({
  // Always present
  page:  parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  sort:  getSortingStateParser<EntityType>().withDefault([{ id: "createdAt", desc: true }]),

  // Global text search — present when table has a "text" variant column with id "search"
  search: parseAsString.withDefault(""),

  // One entry per filterable column, keyed by the column's id
  status:           parseAsArrayOf(parseAsStringEnum(["active","inactive","banned"])).withDefault([]),
  gender:           parseAsArrayOf(parseAsStringEnum(["male","female"])).withDefault([]),
  onlyWithoutParent: parseAsString.withDefault(""),
  createdAt:        parseAsString.withDefault(""),   // dateRange: "ms1,ms2"
  // ...
});
```

**Column id → schema key must match exactly.** If the column has `id: "search"`, the
schema key must be `search`. If the column has `accessorKey: "status"` and no explicit
`id`, the schema key must be `"status"`.

---

## 6. `page.tsx` Checklist

```ts
export default async function EntityPage({ searchParams }: EntityPageProps) {
  const search = await entitySearchParamsCache.parse(await searchParams);

  // 1. Build filters object
  const filters: Record<string, string | string[]> = {};
  if (search.status.length > 0)       filters["status[in]"]        = search.status;
  if (search.gender.length > 0)       filters["gender[in]"]        = search.gender;
  if (search.someField)               filters["someField[eq]"]     = search.someField;
  if (search.createdAt)               filters["createdAt[between]"] = search.createdAt;

  // 2. Build final query object
  const query: Record<string, string | string[] | number | boolean> = {
    page:  search.page,
    limit: search.limit,
    ...(search.search                   && { search: search.search }),
    ...(search.sort.length              && { sort: serializeSort(search.sort) }),
    ...(Object.keys(filters).length > 0 && { filters: JSON.stringify(filters) }),
    // custom top-level params (non-standard backend handlers)
    ...(search.onlyWithoutParent === "true" && { onlyWithoutParent: true }),
  };

  // 3. Fetch
  const promises = Promise.all([
    apiClient<PaginatedResponse<Entity>>(ENTITY_ENDPOINT, { query })
      .then((res) => res.data),
  ]);

  // 4. Render with Suspense (key forces re-mount when query changes)
  return (
    <React.Suspense key={JSON.stringify(query)} fallback={<EntityTableFallback />}>
      <EntityTable promises={promises} />
    </React.Suspense>
  );
}
```

---

## 7. `{entity}-table.tsx` Checklist

```tsx
"use client";

export function EntityTable({ promises }: { promises: Promise<[PaginatedResponse<Entity>]> }) {
  "use no memo";   // ← REQUIRED: project has reactCompiler: true

  const [{ items, meta }] = React.use(promises);

  const { table } = useDataTable({
    data: items,
    columns,
    pageCount: meta.totalPages,        // ← drives server-side pagination
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],   // must match schema default
      columnPinning: { right: ["actions"] },
    },
    queryKeys: { perPage: "limit" },   // ← renames pageSize URL param to "limit"
    shallow: false,                    // ← false = URL change triggers RSC re-render
    clearOnDefault: true,
  });

  return (
    <DataTable table={table} actionBar={<EntityTableActionBar table={table} />}>
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} align="end" />
      </DataTableToolbar>
    </DataTable>
  );
}
```

**`"use no memo"`** on the component and `"use no memo"` inside `useDataTable` are both
required because `reactCompiler: true` in `next.config.ts` conflicts with TanStack Table's
internal `getState()` memoization. Without it, filters and sort may not update correctly.

---

## 8. Step-by-Step Checklist for Adding a New Table

When you give this document to Claude, also specify:
- The entity name (e.g. "Instructors")
- The backend endpoint path (e.g. `GET /instructors`)
- The `searchableFields` the backend searches (from the backend service file)
- Which columns need filters and what type (multiSelect, text, dateRange, boolean, etc.)
- Any custom top-level params (non-standard filter params the backend handles specially)

### Steps Claude will follow

```
□ 1. Create src/features/{entity}/types/index.ts
      - Mirror the backend entity shape exactly

□ 2. Add endpoint constant to src/services/api/queries.ts
      - e.g. export const INSTRUCTORS = "INSTRUCTORS"

□ 3. Add endpoint config to src/services/api/endpoints.ts
      - url, method: "GET"

□ 4. Create src/features/{entity}/schemas/index.ts
      - One parser per filterable column + page + limit + sort + search

□ 5. Create src/features/{entity}/components/{entity}-table-columns.tsx
      - id: "search" for the global text filter column
      - meta.variant for each filterable column
      - enableSorting: false for computed/relation columns
      - enableColumnFilter: true only for columns with schema entries

□ 6. Create src/features/{entity}/components/{entity}-table.tsx
      - "use no memo" at the top
      - useDataTable with shallow: false, queryKeys: { perPage: "limit" }
      - pageCount: meta.totalPages

□ 7. Create src/app/[locale]/(dashboard)/.../{entity}/page.tsx
      - serializeSort() → JSON.stringify({field: "ASC"|"DESC"})
      - Build filters object mapping schema values → [operator] keys
      - Pass filters as JSON.stringify(filters)
      - Wrap table in <React.Suspense key={JSON.stringify(query)}>

□ 8. Add translation keys to messages/{locale}/EntityName.json
      - columns.*, filters.*, status.*, actions.*
```

---

## 9. Common Mistakes to Avoid

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| `serializeSort` produces `"createdAt.desc"` (dot format) | Backend ignores sort entirely | Use `JSON.stringify({"createdAt":"DESC"})` |
| Column `id` doesn't match schema key | Filter value never sent to backend | Keep `id` and schema key identical |
| Missing schema entry for a filterable column | URL param appears but page never reads it | Add parser to `searchParamsCache` |
| `shallow: true` (or default) in `useDataTable` | URL changes don't trigger server re-fetch | Always set `shallow: false` |
| Omitting `"use no memo"` in table component | React Compiler breaks TanStack Table state reads | Add `"use no memo"` as first line |
| `queryKeys: { perPage: "limit" }` missing | Pagination uses `perPage` in URL, backend gets no `limit` | Always include this option |
| `key={JSON.stringify(query)}` missing on Suspense | Stale data shown on filter change | Always add `key` to force Suspense re-mount |
| `filters` sent as plain object instead of JSON string | Backend receives `[object Object]` | Always `JSON.stringify(filters)` |
| Date range filter sends ms timestamps without conversion | Backend `BETWEEN` fails on datetime columns | Convert ms to ISO strings if backend column is `timestamp` |
| `enableColumnFilter: true` without schema entry | Orphan URL param, no backend effect | Add schema entry or remove `enableColumnFilter` |

---

## 10. Users Table — Reference Implementation

The Users table is the canonical example. All other tables follow this exact pattern.

### Filter columns and their mappings

| Column id | `meta.variant` | Schema parser | Backend param |
|-----------|---------------|--------------|--------------|
| `search` | `text` | `parseAsString` | `search=ahmed` (top-level) |
| `status` | `multiSelect` | `parseAsArrayOf(parseAsStringEnum(...))` | `filters={"status[in]":"active,inactive"}` |
| `gender` | `multiSelect` | `parseAsArrayOf(parseAsStringEnum(...))` | `filters={"gender[in]":"male"}` |
| `createdAt` | `dateRange` | `parseAsString` | `filters={"createdAt[between]":"ms1,ms2"}` |
| `onlyWithoutParent` | `boolean` | `parseAsString` | `onlyWithoutParent=true` (top-level custom param) |

### Sort
Default: `[{"id":"createdAt","desc":true}]` → `{"createdAt":"DESC"}`

### File locations
- Page: `src/app/[locale]/(dashboard)/(user-management)/users/page.tsx`
- Schema: `src/features/users/schemas/index.ts`
- Types: `src/features/users/types/index.ts`
- Table: `src/features/users/components/users-table.tsx`
- Columns: `src/features/users/components/users-table-columns.tsx`
- Action bar: `src/features/users/components/users-table-action-bar.tsx`

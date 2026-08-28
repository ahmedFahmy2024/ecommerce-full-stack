# Users Table — Deep Dive

> Senior → Junior walkthrough of how the Users table page works end-to-end:
> data display, filtering, searching, sorting, and pagination.

---

## 1. The Big Picture

Before touching any file, understand the mental model:

```
URL bar
  └── Server Component (page.tsx)         — reads URL, calls API
        └── Client Component (UsersTable)  — owns all UI state
              ├── useDataTable hook         — syncs UI state ↔ URL
              ├── DataTable                 — renders rows/columns
              ├── DataTableToolbar          — renders filters/search
              └── DataTablePagination       — renders page controls
```

**The URL is the single source of truth.** Every filter, sort order, page number, and search term lives in the URL as query params. When you change a filter, nuqs updates the URL, Next.js re-runs the Server Component, a new API call fires, and fresh data comes back. There is no separate "filter state in memory" — it's all in the URL.

---

## 2. Layer 1 — The Page (Server Component)

**File:** [`src/app/[locale]/(dashboard)/(user-management)/users/page.tsx`](../src/app/[locale]/(dashboard)/(user-management)/users/page.tsx)

This is a **React Server Component** (RSC). It runs on the server on every navigation. Its job is:

1. Parse the URL search params into typed values
2. Build the API query object from those values
3. Fire the API call
4. Hand the resulting promise down to the Client Component

### 2.1 Parsing URL Params

```ts
const search = await usersSearchParamsCache.parse(searchParams);
```

`usersSearchParamsCache` comes from [`src/features/users/schemas/index.ts`](../src/features/users/schemas/index.ts) and is built with `nuqs/server`. It defines the shape and defaults of every URL param the page understands:

| URL param          | Type                            | Default |
| ------------------ | ------------------------------- | ------- |
| `page`             | integer                         | `1`     |
| `limit`            | integer                         | `10`    |
| `sort`             | `ExtendedColumnSort<User>[]`    | `[]`    |
| `search`           | string                          | `""`    |
| `status`           | `("active"\|"inactive"\|"banned")[]` | `[]` |
| `gender`           | `("male"\|"female")[]`          | `[]`    |
| `onlyWithoutParent`| string                          | `""`    |
| `onlyChildren`     | string                          | `""`    |

If a param is missing from the URL the parser fills in the default — so the rest of the code can always trust typed values.

### 2.2 Building the API Query

The page takes the parsed values and shapes them into what the backend expects:

```ts
// Sorting: array of {id, desc} → JSON string
const serializedSort = serializeSort(search.sort);

// Multi-select filters use [in] operator
const statusFilter = search.status.length
  ? { status: { "[in]": search.status.join(",") } }
  : {};

// Boolean filters are sent as the string "true" or omitted
const onlyWithoutParentFilter = search.onlyWithoutParent === "true"
  ? { onlyWithoutParent: true }
  : {};
```

Then everything merges into one query object passed to `apiClient`.

### 2.3 Why Server Component?

- The API call happens on the server — no loading spinner on first paint.
- The data is streamed into the page via React `Suspense`. While the promise resolves the user sees a skeleton.
- URL params are always in sync with what was fetched — no stale-closure bugs.

---

## 3. Layer 2 — The Users Table (Client Component)

**File:** [`src/features/users/components/users-table.tsx`](../src/features/users/components/users-table.tsx)

This is a `"use client"` component. It receives a **Promise** (not resolved data) as a prop — it calls `React.use(promise)` to unwrap it. This is the React 19 way: the Server Component kicks off the fetch, the Client Component suspends until it resolves.

```ts
const { items, meta } = React.use(usersPromise);
```

### 3.1 Table Initialization

```ts
const columns = React.useMemo(
  () => getColumns({ t, setRowAction }),
  [t, setRowAction]
);
```

Column definitions are memoized. They are recreated only when the translation function or row-action setter changes.

```ts
const { table } = useDataTable({
  data: items,
  columns,
  pageCount: meta.totalPages,
  queryKeys: { perPage: "limit" },  // backend uses "limit" not "perPage"
  shallow: false,
  clearOnDefault: true,
});
```

`shallow: false` means every filter change causes a full Next.js navigation (server re-fetch). `clearOnDefault: true` removes a param from the URL when it equals its default — keeps URLs clean.

### 3.2 Column Visibility: Hidden Filter Columns

```ts
columnVisibility: {
  onlyWithoutParent: false,
  onlyChildren: false,
},
```

`onlyWithoutParent` and `onlyChildren` are real TanStack Table columns — but they are always hidden from the visual table. They exist only so the filter system can attach state to them. Their filter UI appears in the toolbar as toggle buttons.

### 3.3 Column Pinning

```ts
columnPinning: { right: ["actions"] },
```

The actions column is pinned to the right edge and stays visible when the table scrolls horizontally.

---

## 4. Layer 3 — Column Definitions

**File:** [`src/features/users/components/users-table-columns.tsx`](../src/features/users/components/users-table-columns.tsx)

`getColumns()` returns an array of TanStack Table `ColumnDef<User>` objects. Each column has three concerns:

1. **What data to show** (`accessorKey` / `accessorFn`)
2. **How to render the cell** (`cell`)
3. **Filter metadata** (`meta`) — tells the toolbar what kind of filter UI to show

### 4.1 Column Map

| Column ID           | Shown | Sortable | Filter variant  |
| ------------------- | :---: | :------: | --------------- |
| `select`            | ✓     | —        | —               |
| `search` (fullName) | ✓     | —        | `text`          |
| `email`             | ✓     | —        | —               |
| `phone`             | ✓     | —        | —               |
| `status`            | ✓     | ✓        | `multiSelect`   |
| `gender`            | ✓     | —        | `multiSelect`   |
| `countryName`       | ✓     | —        | —               |
| `roles`             | ✓     | —        | —               |
| `createdAt`         | ✓     | ✓        | —               |
| `onlyWithoutParent` | hidden | —       | `boolean`       |
| `onlyChildren`      | hidden | —       | `boolean`       |
| `actions`           | ✓     | —        | —               |

### 4.2 Column Meta — The Contract with the Toolbar

The `meta` property on a column is how a column tells the toolbar "I have a filter, and here is what kind":

```ts
// Text search filter
{
  id: "search",
  meta: {
    label: t("columns.fullName"),
    placeholder: t("filters.searchPlaceholder"),
    variant: "text",
  },
  enableColumnFilter: true,
}

// Multi-select filter
{
  id: "status",
  meta: {
    label: t("columns.status"),
    variant: "multiSelect",
    options: [
      { label: t("status.active"),   value: "active" },
      { label: t("status.inactive"), value: "inactive" },
      { label: t("status.banned"),   value: "banned" },
    ],
  },
  enableColumnFilter: true,
}

// Boolean toggle filter (hidden column)
{
  id: "onlyWithoutParent",
  meta: {
    label: t("filters.onlyWithoutParent"),
    variant: "boolean",
  },
  enableColumnFilter: true,
}
```

`enableColumnFilter: true` is what causes `useDataTable` to pick this column up and wire its state into the URL.

### 4.3 Status Badge Rendering

```ts
cell: ({ row }) => {
  const status = row.getValue("status");
  const variantMap = {
    active:   "default",
    inactive: "secondary",
    banned:   "destructive",
  };
  return <Badge variant={variantMap[status]}>{t(`status.${status}`)}</Badge>;
}
```

Status is shown as a colored badge. The color comes from the variant map. The text comes from translations.

### 4.4 Date Rendering

```ts
cell: ({ row }) => {
  const raw = row.getValue("createdAt");
  return new Date(raw + "Z").toLocaleDateString();
}
```

The `+ "Z"` forces UTC interpretation so dates don't shift by timezone offset.

---

## 5. Layer 4 — `useDataTable` Hook

**File:** [`src/hooks/use-data-table.ts`](../src/hooks/use-data-table.ts)

This is the engine. It bridges TanStack Table (UI state) and nuqs (URL state).

### 5.1 Pagination in the URL

```ts
const [page, setPage] = useQueryState("page", parsers.integer.withDefault(1));
const [perPage, setPerPage] = useQueryState("limit", parsers.integer.withDefault(10));
```

`useQueryState` from nuqs binds a React state value directly to a URL query param. Reading `page` reads from the URL; setting `page` updates the URL.

### 5.2 Sorting in the URL

The sort state is a JSON array stored in a single `sort` param:

```
?sort=[{"id":"status","desc":false},{"id":"createdAt","desc":true}]
```

The parser validates that each sort id matches an actual sortable column, preventing garbage in the URL from causing errors.

### 5.3 Filter State in the URL

For each column with `enableColumnFilter: true`, the hook builds a nuqs parser. Multi-select columns use array parsers; text columns use string parsers.

```
?status=active,inactive&search=ahmed&onlyWithoutParent=true
```

**Debouncing:** Text input changes are debounced 300 ms before they write to the URL. This prevents a new API call on every keystroke.

**Auto-reset to page 1:** Any time a filter changes, the hook resets `page` back to `1` automatically. You never end up on page 5 of a filtered result set that only has 2 pages.

### 5.4 Manual Mode

```ts
manualPagination: true,
manualSorting: true,
manualFiltering: true,
```

TanStack Table is told not to do any client-side pagination, sorting, or filtering. All of that happens on the server. The table just renders what it receives.

---

## 6. Layer 5 — DataTableToolbar

**File:** [`src/components/data-table/data-table-toolbar.tsx`](../src/components/data-table/data-table-toolbar.tsx)

The toolbar iterates over every column that has `enableColumnFilter: true` and renders the appropriate filter widget based on `column.columnDef.meta.variant`:

```
"text"        → DataTableTextFilter       (debounced text input)
"multiSelect" → DataTableFacetedFilter    (popover checkboxes)
"boolean"     → Toggle button             (sends "true" string)
"select"      → DataTableFacetedFilter    (single-select)
"range"       → DataTableSliderFilter
"date"        → DataTableDateFilter
```

### 6.1 Text Filter (Search)

```ts
// 500ms debounce at the input level
const handleChange = useDebouncedCallback((value: string) => {
  column.setFilterValue(value || undefined);
}, 500);
```

The user types → local state updates instantly (input feels responsive) → after 500 ms the filter value is committed → `useDataTable` writes to URL → Server Component re-fetches.

### 6.2 Faceted Filter (Multi-Select)

The `DataTableFacetedFilter` opens a popover with a searchable list of options. Each option has a checkbox. Selecting options toggles them in/out of the filter array.

It can show a count badge per option (e.g. "active (42)") if the API returns facet counts. In this project the API returns a `facets` field in the response for this purpose.

### 6.3 Boolean Filter

```ts
<Button
  variant={isActive ? "default" : "outline"}
  onClick={() => column.setFilterValue(isActive ? undefined : "true")}
>
  {label}
</Button>
```

Clicking the button either sets the filter to `"true"` or clears it. On the server side the page checks `search.onlyWithoutParent === "true"` and appends the param to the API query.

### 6.4 Reset Button

A "Reset" button appears when any filter has a value. It calls `table.resetColumnFilters()` which clears all filter state and (because `clearOnDefault: true`) removes all filter params from the URL.

---

## 7. Layer 6 — Sorting

**File:** [`src/components/data-table/data-table-sort-list.tsx`](../src/components/data-table/data-table-sort-list.tsx)

Multi-column sorting lives in a separate popover (the "Sort" button in the toolbar). Features:

- Add multiple sort rules
- Drag-and-drop to reorder sort priority
- Toggle ASC/DESC per rule
- Remove individual rules
- `Ctrl+Shift+S` keyboard shortcut

The sort array is serialized to JSON and stored in the `sort` URL param. The Server Component deserializes it and sends it to the backend.

---

## 8. Layer 7 — DataTable Rendering

**File:** [`src/components/data-table/data-table.tsx`](../src/components/data-table/data-table.tsx)

This component takes the `table` instance from `useDataTable` and renders the HTML table. Nothing clever here — just mapping TanStack Table's row/column model to `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>`.

Column pinning is handled by `getColumnPinningStyle()` which computes `position: sticky` and `left/right` offsets for pinned columns.

---

## 9. Internationalization

**Files:** [`messages/en/Users.json`](../messages/en/Users.json), [`messages/ar/Users.json`](../messages/ar/Users.json)

Every piece of user-visible text goes through `next-intl`. In column definitions:

```ts
const t = useTranslations("Users");
// t("columns.status") → "Status" (en) or "الحالة" (ar)
```

Locale is determined by the `[locale]` URL segment. The `next-intl` middleware injects it and the layout loads the correct message file. No hard-coded strings anywhere in the table.

---

## 10. Full Data Flow (Step by Step)

Here is what happens when a user lands on `/en/users` and then types "ahmed" in the search box:

```
1. Browser → GET /en/users
2. Next.js runs UsersPage (Server Component)
   - Parses searchParams: { page:1, limit:10, search:"", ... }
   - Calls apiClient("users", { query: { page:1, limit:10 } })
   - API returns { items: [...], meta: { totalPages: 5, ... } }
3. React streams HTML to browser
   - Suspense boundary shows DataTableSkeleton while resolving
   - Once resolved, renders UsersTable with 10 user rows
4. User types "ahmed" in search input
   - Local input state updates instantly (no lag)
   - 500ms debounce timer starts
5. After 500ms:
   - column.setFilterValue("ahmed") called
   - useDataTable writes to URL via nuqs: ?search=ahmed&page=1
   - shallow:false → full Next.js navigation triggered
6. Next.js re-runs UsersPage
   - Parses: { search:"ahmed", page:1, limit:10 }
   - Calls apiClient("users", { query: { search:"ahmed", page:1, limit:10 } })
   - API returns filtered results
7. UsersTable re-renders with new items
   - Search input stays focused (nuqs handles this)
   - URL shows ?search=ahmed — shareable, bookmarkable
```

---

## 11. Key Design Decisions (and Why)

### URL as state
Filters are in the URL, not in component state. This means a filtered/sorted view is **bookmarkable and shareable**. If you copy the URL and open it in another tab you get the same table state. This is the correct approach for admin dashboards.

### Server-side filtering
Data is filtered on the backend, not in the browser. The table never loads all users — it only loads the current page. This scales to millions of rows without any performance issue on the client.

### Debouncing
Text search is debounced twice: once at the input (500ms, in the toolbar) and once in `useDataTable` (300ms). The toolbar debounce prevents URL writes on every keystroke. The `useDataTable` debounce is a safety net for programmatic updates.

### Hidden columns for boolean filters
`onlyWithoutParent` and `onlyChildren` have no visual column in the table, but TanStack Table still tracks their filter state. This lets the existing filter machinery handle them without any special cases — the toolbar sees them as normal filterable columns and renders a boolean toggle.

### `"use no memo"` directive
The codebase has `reactCompiler: true` enabled in Next.js config. React Compiler auto-memoizes components, but TanStack Table reads `table.getState()` in ways that confuse the compiler's dependency tracking. Components that read table state are annotated with `"use no memo"` to opt out of compiler memoization and avoid stale renders.

---

## 12. File Reference Map

| What you want to change | File to edit |
| ----------------------- | ------------ |
| Add/remove a column | [`users-table-columns.tsx`](../src/features/users/components/users-table-columns.tsx) |
| Add a new filter | Add column with `meta.variant` + `enableColumnFilter: true` in columns file; add URL param in [`schemas/index.ts`](../src/features/users/schemas/index.ts); handle it in [`page.tsx`](../src/app/[locale]/(dashboard)/(user-management)/users/page.tsx) |
| Change page size options | [`data-table-pagination.tsx`](../src/components/data-table/data-table-pagination.tsx) |
| Change debounce timings | `useDataTable` call in [`users-table.tsx`](../src/features/users/components/users-table.tsx) |
| Add bulk action | [`users-table-action-bar.tsx`](../src/features/users/components/users-table-action-bar.tsx) |
| Add a new filter type | [`data-table-toolbar.tsx`](../src/components/data-table/data-table-toolbar.tsx) |
| Change translations | [`messages/en/Users.json`](../messages/en/Users.json) / [`messages/ar/Users.json`](../messages/ar/Users.json) |
| Change API query shape | [`page.tsx`](../src/app/[locale]/(dashboard)/(user-management)/users/page.tsx) |

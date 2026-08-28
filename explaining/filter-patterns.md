# Filter Patterns — Toolbar vs Advanced Sheet

This project has two filter systems. Knowing which one to use and how to wire each up saves a lot of time.

---

## The Two Systems at a Glance

| | Toolbar Filter | Advanced Filter Sheet |
|---|---|---|
| **Where it lives** | Inline in the toolbar, always visible | Right-side Sheet, opened by a button |
| **Good for** | 1–5 simple filters (text, select, boolean, date) | Many filters, or filters that don't map to a visible column |
| **Driven by** | TanStack Table column `meta` + `enableColumnFilter` | Independent `useQueryStates` / `useQueryState` calls |
| **Commits to URL** | On every change (debounced for text) | Only when "Apply" is clicked |
| **Reset** | Toolbar's built-in Reset button | Toolbar Reset (via `onExtraReset` prop) + sheet's own Reset |
| **Example in this repo** | Users table (`status`, `gender`, `onlyWithoutParent`) | Users-in-Class table (all statistical/date filters) |

---

## System 1 — Toolbar Filter

Use this when you have a small number of filters that map naturally to table columns.

### How it works

`DataTableToolbar` iterates every column with `enableColumnFilter: true` and reads `column.columnDef.meta.variant` to decide which widget to render:

```
"text"        → debounced text input
"multiSelect" → popover with checkboxes   (DataTableFacetedFilter)
"select"      → popover, single-select    (DataTableFacetedFilter)
"boolean"     → toggle button
"range"       → slider with min/max       (DataTableSliderFilter)
"date"        → date picker               (DataTableDateFilter)
"dateRange"   → date range picker         (DataTableDateFilter)
"number"      → number input
```

### Step-by-step: adding a toolbar filter

**1. Add the URL param to the schema** (`src/features/<name>/schemas/index.ts`)

```ts
// text / search
search: parseAsString.withDefault(""),

// multi-select enum
status: parseAsArrayOf(parseAsStringEnum(["active", "inactive"])).withDefault([]),

// boolean flag
onlyVip: parseAsString.withDefault(""),
```

**2. Add the column** (`src/features/<name>/components/<name>-table-columns.tsx`)

```ts
// Text search (usually mapped to an existing visible column)
{
  id: "search",
  accessorKey: "fullName",
  enableSorting: false,
  enableColumnFilter: true,
  meta: {
    label: t("columns.fullName"),
    variant: "text",
    placeholder: t("filters.searchPlaceholder"),
  },
}

// Multi-select on a visible column
{
  accessorKey: "status",
  enableColumnFilter: true,
  meta: {
    label: t("columns.status"),
    variant: "multiSelect",
    options: [
      { label: t("status.active"),   value: "active" },
      { label: t("status.inactive"), value: "inactive" },
    ],
  },
}

// Boolean — hidden column (no visual cell, filter only)
{
  id: "onlyVip",
  accessorKey: "isVip",          // any field, value doesn't matter
  header: () => null,
  cell: () => null,
  enableSorting: false,
  enableHiding: true,
  enableColumnFilter: true,
  meta: {
    label: t("filters.onlyVip"),
    variant: "boolean",
  },
}
```

> **Hidden columns** — set `columnVisibility: { onlyVip: false }` in `useDataTable`'s `initialState` so the column never appears in the table body but its filter state is still tracked.

**3. Read the params in the page** (`src/app/[locale]/…/page.tsx`)

```ts
const search = await mySearchParamsCache.parse(await searchParams);

const query: Record<string, ...> = {
  page: search.page,
  limit: search.limit,
  ...(search.search && { search: search.search }),
  // multi-select → send as filters[field[in]]
  ...(search.status.length > 0 && {
    filters: JSON.stringify({ "status[in]": search.status }),
  }),
  // boolean → send as top-level param
  ...(search.onlyVip === "true" && { onlyVip: true }),
};
```

**4. Nothing else needed** — `DataTableToolbar` picks up the column automatically. The Reset button appears as soon as any filter has a value.

---

## System 2 — Advanced Filter Sheet

Use this when you have many filters (more than ~5), or filters that are statistical/analytical and don't map cleanly to a visible table column (ranges, date windows, boolean flags like `onlyPassed`).

### How it works

- A dedicated `Sheet` component holds all the filter controls.
- Controls write to a **local draft state** — nothing hits the URL while you're choosing filters.
- Clicking **Apply** pushes the entire draft to the URL at once via `useQueryStates` / `useQueryState`. This triggers one single server navigation.
- Clicking **Reset** (in the sheet footer, or the toolbar's Reset button) clears both draft and URL.
- The trigger button shows a **badge count** of how many URL params are currently active.

### Step-by-step: adding an advanced filter sheet

**1. Add all URL params to the schema** (`src/features/<name>/schemas/index.ts`)

```ts
import { parseAsBoolean, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server";

export const mySearchParamsCache = createSearchParamsCache({
  // existing
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),

  // advanced — enum
  sortOrder: parseAsStringEnum(["alphabetical", "mostSuccessful"]).withDefault("alphabetical"),

  // advanced — numbers (nullable = absent from URL when null)
  minScore: parseAsInteger,
  maxScore: parseAsInteger,

  // advanced — booleans (nullable)
  onlyPassed: parseAsBoolean,

  // advanced — dates (strings, empty = absent)
  fromDate: parseAsString.withDefault(""),
  toDate:   parseAsString.withDefault(""),
});
```

**2. Create the filter sheet component** (`src/features/<name>/components/<name>-filter-sheet.tsx`)

The key pattern is **draft state**:

```ts
"use client";
import { useQueryState, useQueryStates, parseAsInteger, parseAsBoolean, parseAsString } from "nuqs";

// Define parsers at module level (stable references)
const numberParsers = {
  minScore: parseAsInteger,
  maxScore: parseAsInteger,
};
const booleanParsers = {
  onlyPassed: parseAsBoolean,
};

export function MyFilterSheet({ labels }) {
  // 1. Read/write URL state
  const [urlNumbers, setUrlNumbers] = useQueryStates(numberParsers, {
    shallow: false,
    clearOnDefault: true,
  });
  const [urlBooleans, setUrlBooleans] = useQueryStates(booleanParsers, {
    shallow: false,
    clearOnDefault: true,
  });

  // 2. Local draft — changes here do NOT touch the URL
  const [draft, setDraft] = React.useState({
    numbers: { ...urlNumbers },
    booleans: { ...urlBooleans },
  });

  // 3. Sync draft when sheet opens (so it reflects current URL)
  const onOpenChange = React.useCallback((next) => {
    if (next) {
      setDraft({ numbers: { ...urlNumbers }, booleans: { ...urlBooleans } });
    }
    setOpen(next);
  }, [urlNumbers, urlBooleans]);

  // 4. Apply — commit draft to URL all at once
  const onApply = () => {
    setUrlNumbers(draft.numbers);
    setUrlBooleans(draft.booleans);
    setOpen(false);
  };

  // 5. Reset — clear draft AND URL
  const onReset = () => {
    setDraft({ numbers: { minScore: null, maxScore: null }, booleans: { onlyPassed: null } });
    setUrlNumbers({ minScore: null, maxScore: null });
    setUrlBooleans({ onlyPassed: null });
  };

  // 6. Active count for the badge
  const activeCount =
    Object.values(urlNumbers).filter((v) => v != null).length +
    Object.values(urlBooleans).filter((v) => v != null).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative h-8 font-normal">
          <FilterIcon />
          {labels.title}
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 ...badge styles...">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>{labels.title}</SheetTitle>
        </SheetHeader>

        {/* min-h-0 is required — without it ScrollArea won't shrink and the footer gets hidden */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-6 p-4">
            {/* your filter controls here, all writing to draft not URL */}
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2 border-t px-4 py-3">
          <Button variant="outline" className="flex-1" onClick={onReset} disabled={activeCount === 0}>
            Reset
          </Button>
          <Button className="flex-1" onClick={onApply}>
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

**3. Wire Reset into the toolbar** (`src/features/<name>/components/<name>-table.tsx`)

The toolbar's built-in Reset button can be extended to also clear your advanced URL params:

```ts
// Read URL state to know if anything is active
const [urlNumbers] = useQueryStates(numberParsers);
const [urlBooleans] = useQueryStates(booleanParsers);
const [, setUrlNumbers] = useQueryStates(numberParsers, { shallow: false, clearOnDefault: true });
const [, setUrlBooleans] = useQueryStates(booleanParsers, { shallow: false, clearOnDefault: true });

const advancedActive =
  Object.values(urlNumbers).some((v) => v != null) ||
  Object.values(urlBooleans).some((v) => v != null);

const onExtraReset = React.useCallback(() => {
  setUrlNumbers({ minScore: null, maxScore: null });
  setUrlBooleans({ onlyPassed: null });
}, [setUrlNumbers, setUrlBooleans]);

// Pass to toolbar:
<DataTableToolbar
  table={table}
  isExtraFiltered={advancedActive}   // shows Reset button even when table filters are clear
  onExtraReset={onExtraReset}        // called alongside table.resetColumnFilters()
>
  <MyFilterSheet labels={filterLabels} />
  <DataTableSortList table={table} align="end" />
</DataTableToolbar>
```

**4. Read the params in the page**

```ts
const search = await mySearchParamsCache.parse(await searchParams);

const query = {
  page: search.page,
  limit: search.limit,
  // advanced params go as direct top-level query params (not wrapped in filters[])
  ...(search.minScore != null && { minScore: search.minScore }),
  ...(search.maxScore != null && { maxScore: search.maxScore }),
  ...(search.onlyPassed != null && { onlyPassed: search.onlyPassed }),
  ...(search.fromDate && { fromDate: search.fromDate }),
  ...(search.toDate   && { toDate: search.toDate }),
};
```

---

## Common Pitfalls

### Sheet content overflows — footer gets hidden
Always add `min-h-0` to the `ScrollArea` inside the sheet:
```tsx
<ScrollArea className="min-h-0 flex-1">
```
Without it, flexbox won't shrink the scroll area below its content height, so the footer is pushed off screen.

### Filter fires on every keystroke
For text inputs inside the sheet, write to `draft` state (local), not directly to the URL. Only commit to URL on Apply. For toolbar text filters, the built-in `DataTableTextFilter` already debounces 500 ms automatically.

### Page doesn't reset to 1 after filtering
`useDataTable` resets `page` to `1` automatically when **column filters** change. But advanced sheet params bypass TanStack Table, so you must reset `page` manually in `onApply`:
```ts
const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

const onApply = () => {
  setUrlNumbers(draft.numbers);
  setPage(1);   // ← add this
  setOpen(false);
};
```

### Two Reset buttons appearing
If you add your own Reset button in the toolbar children AND pass `isExtraFiltered` to `DataTableToolbar`, you get two buttons. Use only the `isExtraFiltered` + `onExtraReset` props — let the toolbar own the single Reset button.

### `"use no memo"` on components that read `table.getState()`
`reactCompiler: true` is enabled. Any component (table, toolbar, etc.) that calls `table.getState()` or reads TanStack Table state must have `"use no memo"` at the top to opt out of auto-memoization. Without it you'll get stale renders where the filter state in the UI doesn't match what's in the URL.

---

## Decision Checklist

```
Do you have ≤ 5 filters?
  └── Yes → Toolbar Filter (System 1)
  └── No  → Advanced Sheet (System 2)

Do your filters map to visible table columns?
  └── Yes → Toolbar Filter
  └── No  → Advanced Sheet (or hidden columns for simple booleans)

Do you need the user to select multiple filters before applying?
  └── Yes → Advanced Sheet (draft pattern)
  └── No  → Toolbar Filter (instant URL write)

Are filters statistical / analytical (rates, counts, date windows)?
  └── Yes → Advanced Sheet
  └── No  → Either works
```

# Plan: Users-in-Class Advanced Filters

## Context

The `GET /classes/:id/users-in-class` backend endpoint has been updated with a rich set of filter/sort parameters via `GetUsersInClassQueryDto`. The frontend currently only exposes a text search and one sort column (`createdAt`). This plan adds full filter support to match what the backend now accepts.

---

## Backend Parameters (source of truth)

| Parameter | Type | Notes |
|---|---|---|
| `sortOrder` | enum | `alphabetical` \| `mostSuccessful` \| `leastSuccessful` \| `mostAttendance` \| `leastAttendance` |
| `material_id` | UUID string | Scopes all stats/sorting to one material |
| `minSuccessCount` | number (≥0) | Min passed quizzes |
| `maxSuccessCount` | number (≥0) | Max passed quizzes |
| `minAttendanceCount` | number (≥0) | Min taken quizzes |
| `maxAttendanceCount` | number (≥0) | Max taken quizzes |
| `minSuccessRate` | number 0-100 | Min success % |
| `maxSuccessRate` | number 0-100 | Max success % |
| `minCompletionRate` | number 0-100 | Min completion % |
| `maxCompletionRate` | number 0-100 | Max completion % |
| `hasNotTakenAnyQuiz` | boolean | Students with zero quizzes taken |
| `onlyPassed` | boolean | Students with no failed quizzes |
| `onlyFailed` | boolean | Students with ≥1 failed quiz |
| `lastExamBefore` | ISO date string | Last exam before date |
| `lastExamAfter` | ISO date string | Last exam after date |
| `examDateFrom` | ISO date string | Any exam taken from date |
| `examDateTo` | ISO date string | Any exam taken until date |
| `notExaminedSince` | ISO date string | No exam since date |
| `search` | string | Already implemented |
| `sort` | JSON object | Already implemented (`createdAt`) |
| `page` / `limit` | number | Already implemented |
| `filters[parentName/Status/Phone]` | string | Already available via base DTO |

---

## Files to Modify

| File | Change |
|---|---|
| `src/features/classes/schemas/users-in-class.ts` | Add all new nuqs parsers |
| `src/features/classes/components/users-in-class-table-columns.tsx` | Add `meta` filter config to relevant columns + add virtual filter-only columns |
| `src/app/[locale]/(dashboard)/(education)/classes/view/[id]/page.tsx` | Read new params from cache, build query object |
| `messages/en/Classes.json` | Add filter label keys |
| `messages/ar/Classes.json` | Add Arabic filter label keys |

---

## Implementation Steps

### 1. Schema — `src/features/classes/schemas/users-in-class.ts`

Add nuqs parsers for every new parameter:

```ts
import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const usersInClassSearchParamsCache = createSearchParamsCache({
  // existing
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<UserInClass>().withDefault([]),
  search: parseAsString.withDefault(""),

  // new — sorting
  sortOrder: parseAsStringEnum([
    "alphabetical", "mostSuccessful", "leastSuccessful",
    "mostAttendance", "leastAttendance",
  ]).withDefault("alphabetical"),

  // new — material scope
  material_id: parseAsString.withDefault(""),

  // new — counts (integers)
  minSuccessCount: parseAsInteger,
  maxSuccessCount: parseAsInteger,
  minAttendanceCount: parseAsInteger,
  maxAttendanceCount: parseAsInteger,

  // new — rates (integers, 0-100)
  minSuccessRate: parseAsInteger,
  maxSuccessRate: parseAsInteger,
  minCompletionRate: parseAsInteger,
  maxCompletionRate: parseAsInteger,

  // new — booleans
  hasNotTakenAnyQuiz: parseAsBoolean,
  onlyPassed: parseAsBoolean,
  onlyFailed: parseAsBoolean,

  // new — dates (ISO strings via parseAsString)
  lastExamBefore: parseAsString.withDefault(""),
  lastExamAfter: parseAsString.withDefault(""),
  examDateFrom: parseAsString.withDefault(""),
  examDateTo: parseAsString.withDefault(""),
  notExaminedSince: parseAsString.withDefault(""),
});
```

> Use `parseAsString` for dates (not `parseAsIsoDateTime`) because the backend expects ISO strings and the existing date filter UI writes string values to the URL.

### 2. Columns — `src/features/classes/components/users-in-class-table-columns.tsx`

Add `meta` to the existing columns that map to a filter, and add **virtual columns** (hidden, filter-only, `cell: () => null`) for parameters that have no visible column:

**Columns with updated meta (filter added):**
- `quizTaken` → `variant: "number"` for `minAttendanceCount` / `maxAttendanceCount`  
  *(these become two separate virtual columns instead, see below)*
- `quizPassed` → same pattern

**New virtual filter-only columns** (each maps to one query param):

| Column `id` | `variant` | Backend param |
|---|---|---|
| `sortOrder` | `select` | `sortOrder` |
| `material_id` | `text` | `material_id` |
| `minSuccessCount` | `number` | `minSuccessCount` |
| `maxSuccessCount` | `number` | `maxSuccessCount` |
| `minAttendanceCount` | `number` | `minAttendanceCount` |
| `maxAttendanceCount` | `number` | `maxAttendanceCount` |
| `minSuccessRate` | `number` | `minSuccessRate` |
| `maxSuccessRate` | `number` | `maxSuccessRate` |
| `minCompletionRate` | `number` | `minCompletionRate` |
| `maxCompletionRate` | `number` | `maxCompletionRate` |
| `hasNotTakenAnyQuiz` | `boolean` | `hasNotTakenAnyQuiz` |
| `onlyPassed` | `boolean` | `onlyPassed` |
| `onlyFailed` | `boolean` | `onlyFailed` |
| `lastExamBefore` | `date` | `lastExamBefore` |
| `lastExamAfter` | `date` | `lastExamAfter` |
| `examDateFrom` | `date` | `examDateFrom` |
| `examDateTo` | `date` | `examDateTo` |
| `notExaminedSince` | `date` | `notExaminedSince` |

All virtual columns have: `enableSorting: false`, `enableHiding: true`, `enableColumnFilter: true`, `cell: () => null`, `header: () => null` (or label string for accessibility).

Follow the exact same pattern used in `src/features/users/components/users-table-columns.tsx` for `onlyWithoutParent` and `onlyChildren` boolean columns.

### 3. Page — `src/app/[locale]/(dashboard)/(education)/classes/view/[id]/page.tsx`

Read all new params from the cache and append them as top-level query params (they are NOT wrapped in `filters[...]` — they are direct query params per the DTO):

```ts
const query: Record<string, string | number | boolean> = {
  page: search.page,
  limit: search.limit,
  ...(serializedSort && { sort: serializedSort }),
  ...(search.search && { search: search.search }),

  // sort order
  ...(search.sortOrder && search.sortOrder !== "alphabetical" && { sortOrder: search.sortOrder }),

  // material scope
  ...(search.material_id && { material_id: search.material_id }),

  // counts
  ...(search.minSuccessCount != null && { minSuccessCount: search.minSuccessCount }),
  ...(search.maxSuccessCount != null && { maxSuccessCount: search.maxSuccessCount }),
  ...(search.minAttendanceCount != null && { minAttendanceCount: search.minAttendanceCount }),
  ...(search.maxAttendanceCount != null && { maxAttendanceCount: search.maxAttendanceCount }),

  // rates
  ...(search.minSuccessRate != null && { minSuccessRate: search.minSuccessRate }),
  ...(search.maxSuccessRate != null && { maxSuccessRate: search.maxSuccessRate }),
  ...(search.minCompletionRate != null && { minCompletionRate: search.minCompletionRate }),
  ...(search.maxCompletionRate != null && { maxCompletionRate: search.maxCompletionRate }),

  // booleans
  ...(search.hasNotTakenAnyQuiz != null && { hasNotTakenAnyQuiz: search.hasNotTakenAnyQuiz }),
  ...(search.onlyPassed != null && { onlyPassed: search.onlyPassed }),
  ...(search.onlyFailed != null && { onlyFailed: search.onlyFailed }),

  // dates
  ...(search.lastExamBefore && { lastExamBefore: search.lastExamBefore }),
  ...(search.lastExamAfter && { lastExamAfter: search.lastExamAfter }),
  ...(search.examDateFrom && { examDateFrom: search.examDateFrom }),
  ...(search.examDateTo && { examDateTo: search.examDateTo }),
  ...(search.notExaminedSince && { notExaminedSince: search.notExaminedSince }),
};
```

### 4. Localization

**`messages/en/Classes.json`** — add inside `usersInClass.filters`:
```json
"sortOrder": "Sort Order",
"sortOrderOptions": {
  "alphabetical": "Alphabetical",
  "mostSuccessful": "Most Successful",
  "leastSuccessful": "Least Successful",
  "mostAttendance": "Most Attendance",
  "leastAttendance": "Least Attendance"
},
"materialId": "Material",
"minSuccessCount": "Min Success Count",
"maxSuccessCount": "Max Success Count",
"minAttendanceCount": "Min Attendance Count",
"maxAttendanceCount": "Max Attendance Count",
"minSuccessRate": "Min Success Rate (%)",
"maxSuccessRate": "Max Success Rate (%)",
"minCompletionRate": "Min Completion Rate (%)",
"maxCompletionRate": "Max Completion Rate (%)",
"hasNotTakenAnyQuiz": "Not Taken Any Quiz",
"onlyPassed": "Only Passed",
"onlyFailed": "Only Failed",
"lastExamBefore": "Last Exam Before",
"lastExamAfter": "Last Exam After",
"examDateFrom": "Exam Date From",
"examDateTo": "Exam Date To",
"notExaminedSince": "Not Examined Since"
```

**`messages/ar/Classes.json`** — corresponding Arabic translations.

---

## Grouping Logic (UX)

The filter toolbar will surface all these filters. They naturally group into:
- **Search**: `search` (existing text input)
- **Sort**: `sortOrder` (select)
- **Scope**: `material_id` (text/UUID)
- **Success**: `minSuccessCount`, `maxSuccessCount`, `minSuccessRate`, `maxSuccessRate`, `onlyPassed`, `onlyFailed`
- **Attendance**: `minAttendanceCount`, `maxAttendanceCount`, `minCompletionRate`, `maxCompletionRate`, `hasNotTakenAnyQuiz`
- **Dates**: `lastExamBefore`, `lastExamAfter`, `examDateFrom`, `examDateTo`, `notExaminedSince`

No custom grouping UI is needed — the existing `DataTableFilterMenu` / `DataTableFilterList` renders all `enableColumnFilter: true` columns automatically.

---

## Verification

1. `bun run dev` — navigate to `/classes/view/[someId]`
2. Open the filter menu — confirm all new filter options appear
3. Apply a boolean filter (`onlyPassed=true`) — verify URL updates and the API call includes `onlyPassed=true`
4. Apply a number filter (`minSuccessRate=50`) — verify URL and API call
5. Apply a date filter (`examDateFrom`) — verify URL stores ISO string and API call includes it
6. Apply `sortOrder=mostSuccessful` — verify query param sent
7. `bun run lint` — no lint errors

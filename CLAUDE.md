# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
bun run dev       # Start dev server (localhost:3000)
bun run build     # Production build
bun run start     # Start production server
bun run lint      # Biome linter check
bun run format    # Biome format (writes in place)
```

No test runner is configured. Linting uses Biome (not ESLint/Prettier).

## Architecture

This is a **Next.js 16 admin dashboard** for an education management system. It uses the App Router with locale-based routing via `next-intl`. **React Compiler is enabled** (`reactCompiler: true` in `next.config.ts`).

### Route Structure

All pages live under `src/app/[locale]/`:

- `(auth)/` — login, register, forgot-password, reset-password
- `(dashboard)/(education)/` — batches, classes, stages, categories, materials
- `(dashboard)/(geography)/` — countries, districts, cities
- `(dashboard)/(user-management)/` — students, instructors, supervisors, users, roles, permissions
- `(dashboard)/(learning-resources)/` — banners
- `(dashboard)/(security)/`, `(dashboard)/(settings)/`
- `api/auth/[...nextauth]/` — next-auth route handler

### Feature Modules

`src/features/<name>/` contains co-located components, hooks, schemas (Zod/nuqs), and types for each domain entity. This is the primary place to add new feature code. Typical layout:

```
src/features/<name>/
├── components/
│   ├── <name>-table.tsx          # "use client" + "use no memo"
│   ├── <name>-table-columns.tsx  # column defs with filter meta
│   └── <name>-table-action-bar.tsx
├── hooks/
├── schemas/
│   └── index.ts                  # nuqs search params cache
└── types/
    └── index.ts                  # domain interfaces
```

**`"use no memo"` is required** at the top of any component that reads `table.getState()` or uses `@tanstack/react-table`, because React Compiler's auto-memoization breaks TanStack Table's internal state tracking.

### Key Files

| File                                 | Purpose                                                           |
| ------------------------------------ | ----------------------------------------------------------------- |
| `src/auth.ts`                        | next-auth v5 config (JWT, Credentials provider)                   |
| `src/proxy.ts`                       | Middleware route guard (protects dashboard, redirects auth pages) |
| `src/services/api/index.ts`          | Centralized fetch-based API client                                |
| `src/services/api/endpoints.ts`      | All endpoint definitions (URL, method, toast config)              |
| `src/services/api/queries.ts`        | String constants for every endpoint name                          |
| `src/constants/routes.ts`            | Centralized route helpers (`createCrudRoutes`)                    |
| `src/constants/tables-names.ts`      | Central entity name keys used across i18n, API, and routing       |
| `src/lib/actions/auth.ts`            | `loginAction` server action                                       |
| `src/lib/actions/logout.ts`          | `logoutAction` server action                                      |
| `src/lib/parsers.ts`                 | nuqs parsers for sorting/filtering used by `useDataTable`         |
| `src/hooks/use-data-table.ts`        | Core hook — table + URL-synced pagination/sort/filters            |
| `src/i18n/`                          | next-intl routing config                                          |
| `messages/<locale>/<Namespace>.json` | Translation strings                                               |

### API Client

All backend calls go through `apiClient()` from `src/services/api`. Every endpoint has a string-constant name defined in `queries.ts` and a URL+config in `endpoints.ts`. Never hard-code URLs.

```ts
const response = await apiClient<ResponseType, BodyType>("ENDPOINT_NAME", {
  params: { id },       // replaces {id} placeholders in the URL
  query: { page: 1 },   // appended as query string
  body: { ...data },    // JSON or auto-converted FormData
  onSuccess: (data) => {},
  onError: (error) => {},
});
```

The client auto-injects Bearer token + language header on every request. JSON and `multipart/form-data` are both handled — set `headers: { "Content-Type": "multipart/form-data" }` in the endpoint config and the client will serialize the body as `FormData`. Toast notifications are configurable per endpoint in `endpoints.ts`.

**Endpoint config shape:**

```ts
[USERS_CREATE]: {
  url: "/users",
  config: {
    method: "POST",
    showSuccessToast: true,   // default false
    showErrorToast: true,     // default true
    redirectOnError: true,    // calls notFound() on 404
    throwError: true,         // re-throw after handling
  },
},
[USERS_UPDATE]: { url: "/users/{id}", config: { method: "PATCH", showSuccessToast: true } },
```

**Mutations use direct `apiClient()` calls** — not React Query's `useMutation`. The `onSuccess`/`onError` callbacks plus toast config in `endpoints.ts` replace the need for a mutation hook in most cases.

### Data Tables

Tables are built with `useDataTable` from `src/hooks/use-data-table.ts`. They use **manual** pagination, sorting, and filtering — the backend controls data, not TanStack Table.

URL state is synced via nuqs. The hook reads/writes these params by default: `page`, `limit`, `sort`, `filters`, `joinOperator`. Filters are debounced 300 ms before hitting the URL.

**`useDataTable` options (non-obvious ones):**

| Option                | Default     | Purpose                                            |
| --------------------- | ----------- | -------------------------------------------------- |
| `history`             | `"replace"` | `"push"` adds browser history entries              |
| `debounceMs`          | `300`       | Filter debounce delay                              |
| `throttleMs`          | `50`        | Query state throttle                               |
| `enableAdvancedFilter`| `false`     | When `true`, disables column-level filters         |
| `clearOnDefault`      | —           | Removes param from URL when value equals default   |
| `shallow`             | `true`      | Set `false` to trigger server re-fetch on change   |
| `queryKeys`           | —           | Override URL param names (page, perPage, sort, …)  |

Column definitions include a `meta` object that drives the filter UI:

```ts
{
  id: "status",
  meta: {
    label: t("columns.status"),
    variant: "multiSelect",   // "text" | "number" | "date" | "select" | "multiSelect"
    options: [{ label: "Active", value: "active" }],
    apiKey: "status",         // optional: override the URL param key sent to API
  },
}
```

Each feature's `schemas/index.ts` exports a `createSearchParamsCache(...)` for server-side param parsing (used in Server Components / layouts to pre-fetch with the right query params):

```ts
export const usersSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<User>().withDefault([]),
  search: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(["active", "inactive"])).withDefault([]),
});
export type UsersSearchParams = Awaited<ReturnType<typeof usersSearchParamsCache.parse>>;
```

### Table shell

Feature tables render via `FeatureTableShell` from `src/components/data-table/feature-table-shell.tsx`, which wraps `useDataTable` internally. It sets `shallow: false` and `clearOnDefault: true` automatically, and pins the `"actions"` column to the right by default.

```tsx
<FeatureTableShell
  data={data}
  columns={columns}
  pageCount={meta.totalPages}
  actionBar={<ActionBar table={table} />}   // optional bulk actions
  toolbarExtras={<FilterSheet />}           // optional extra filters
  isExtraFiltered={hasActiveFilters}
  onExtraReset={resetFilters}
/>
```

### Row actions

Row action state is typed as `DataTableRowAction<T>` from `src/types/data-table.ts` (`variant: "update" | "delete"`). Declare it in the table component and pass `setRowAction` down to column defs:

```tsx
const [rowAction, setRowAction] = React.useState<DataTableRowAction<User> | null>(null);
const columns = React.useMemo(() => getColumns({ t, setRowAction }), [t]);
```

In columns, `RowActionsMenu` wraps `DropdownMenuItem` items that call `setRowAction({ row, variant: "update" })` or `"delete"`. The table component renders conditional dialogs/sheets based on `rowAction.variant`.

### Shared types

- `PaginatedResponse<T>` / `ApiResponse<T>` / `ApiError` — `src/types/api.ts`
- `DataTableRowAction<T>`, `FilterVariant`, `ExtendedColumnFilter<T>` — `src/types/data-table.ts`

### Authentication

- next-auth v5 beta with JWT strategy and Credentials provider
- `src/proxy.ts` guards all routes — public paths are `/login`, `/forgot-password`, `/reset-password`
- Unauthenticated users are redirected to `/login?callbackUrl=...` (locale-aware)
- `LogoutButton` uses `<form action={logoutAction}>` for progressive enhancement

### i18n

Namespace-based translation loading via `next-intl`. The `Common` namespace is always loaded; add page-specific namespaces to `src/i18n/request.ts`. Use `useTranslations('Namespace')` in client components, `getTranslations('Namespace')` in server components. TimeZone is always `"Africa/Cairo"`.

Locales: `en` (default), `ar`. Arabic uses `dir="rtl"` set on the `<html>` element. Translation files live at `messages/<locale>/<Namespace>.json`.

Localized entity names follow the pattern `name: { ar: string; en: string }` in type definitions.

### State Management

- **Server state**: React Query 5 (`@tanstack/react-query`) — `QueryClient` is SSR-aware (fresh on server, singleton on client), default `staleTime` 60 s
- **Form state**: React Hook Form + Zod + shadcn form components
- **URL state**: `nuqs` for search params (wrapped inside `useDataTable`; also usable directly)
- **Server mutations**: Next.js Server Actions with `useActionState`

Provider nesting order (in `src/components/providers/`): SessionProvider → QueryProvider → NuqsAdapter → NextIntlClientProvider → DirectionProvider → TooltipProvider.

### UI Components

`src/components/ui/` contains 50+ shadcn/ui components. `src/components/data-table/` has 14 reusable table sub-components (toolbar, filters, pagination, column visibility, etc.) consumed by feature table components.

### Constants & Routes

`src/constants/routes.ts` defines all app routes using `createCrudRoutes(path)`, which returns `{ index, create, edit(id), view(id) }`. Always use these constants — never inline route strings.

`src/constants/tables-names.ts` exports a single object keying every data entity (students, users, classes, etc.). These keys are reused across i18n namespaces, API query constants, and routing.

## Filters

There are two filter patterns. Use the right one for the complexity of the page.

### 1. Column-meta filters (toolbar)

For simple per-column filters (text, select, multiSelect, boolean, date, range). Define them inline on the column:

```ts
{
  id: "status",
  enableColumnFilter: true,
  meta: {
    label: t("columns.status"),
    variant: "multiSelect",          // "text" | "number" | "range" | "date" | "dateRange" | "select" | "multiSelect" | "boolean"
    options: [{ label: "Active", value: "active" }],
    apiKey: "status",                // optional: override the URL param key when sent to API
  },
}
```

`DataTableToolbar` renders the correct filter UI automatically. No other wiring needed.

### 2. Advanced filter sheet

For complex per-page filters (numeric ranges, date pickers, enums, booleans) that don't fit column-level UI. Pattern:

1. Define all params in `features/<name>/schemas/<name>.ts` using `createSearchParamsCache`
2. Build the filter sheet in `features/<name>/components/<name>-filter-sheet.tsx` — use `AdvancedFilterSheet` + `FilterSection` + `FilterRow` from `@/components/data-table/advanced-filter-sheet`
3. In the table client component, read URL state and detect active filters with `useAdvancedFiltersActive` from `@/hooks/use-advanced-filters-active`
4. Pass the sheet as `toolbarExtras` and `isExtraFiltered` / `onExtraReset` to `FeatureTableShell`

### 3. Page server components — always use `buildTableQuery`

Never assemble the API query object by hand. Use `buildTableQuery` from `@/lib/table-query`:

```ts
const query = buildTableQuery(
  { page, limit, sort, search, status, gender },
  { topLevelKeys: ["onlyWithoutParent"] },  // keys passed directly, not JSON-wrapped
);
```

- `page`, `limit`, `sort`, `search` → always top-level
- Array values → JSON-wrapped as `"key[in]": [...]` inside `filters` param
- Scalar values → JSON-wrapped inside `filters` unless listed in `topLevelKeys`
- `topLevelKeys` → use for range/date/boolean/enum params that the backend expects at the top level
- Falsy values (null, undefined, empty string, empty arrays) are excluded entirely

## Vertical slice — adding a new feature

A complete page requires these files (in order):

1. `src/features/<name>/types/index.ts` — entity interface (`name: { ar: string; en: string }` for localized names)
2. `src/features/<name>/schemas/index.ts` — `createSearchParamsCache` with page/limit/sort/search + feature filters
3. `src/features/<name>/components/<name>-table-columns.tsx` — `getColumns({ t, setRowAction })` factory; add `meta` for toolbar filters
4. `src/features/<name>/components/<name>-table.tsx` — `"use client"` + `"use no memo"`; accept `promises`, unwrap with `React.use()`, render `FeatureTableShell`
5. `src/services/api/endpoints.ts` + `src/services/api/queries.ts` — endpoint URL + string constant
6. `src/app/[locale]/(dashboard)/.../<name>/page.tsx` — parse params → `buildTableQuery` → `apiClient` → `<Suspense key={JSON.stringify(query)}>` wrapping the table

The `key={JSON.stringify(query)}` on `<Suspense>` forces re-suspension when query changes. The client component uses `React.use(promises)` to unwrap.

## Tech Stack

- **Framework**: Next.js 16.2.4, React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui, Radix UI, Base UI
- **Auth**: next-auth v5 beta
- **Data fetching**: React Query 5
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl 4
- **Linting/Formatting**: Biome 2
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Charts**: Recharts

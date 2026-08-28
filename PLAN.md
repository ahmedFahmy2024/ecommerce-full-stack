# Auth + i18n Refactor Plan

> Next.js 16.2.4 · Auth.js v5 (next-auth ^5.0.0-beta.31) · next-intl ^4.9.1

---

## Legend

- 🔴 Critical — security or correctness issue
- 🟠 High — performance or architectural problem
- 🟡 Medium — optimization / best practice
- 🟢 Low — minor improvement

---

## Task List

### Phase 1 — Security & Correctness (do first)

- [x] 🔴 **[PROXY]** Add route protection for unauthenticated users
  - File: `src/proxy.ts`
  - Currently unauthenticated users can access all dashboard routes freely — the guard logic is commented out
  - Add `isPublicPath()` helper with allowlist: `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`
  - Redirect unauthenticated users to `/auth/login?callbackUrl=<pathname>`
  - Redirect logged-in users away from public paths with a **locale-aware** home URL (extract locale from pathname prefix)
  - **Before:**
    ```ts
    if (isLoginPage && isLoggedIn) {
      return Response.redirect(new URL("/", req.nextUrl)); // no locale, incomplete
    }
    // missing: redirect unauthenticated users
    return intlMiddleware(req);
    ```
  - **After:**
    ```ts
    if (isLoggedIn && isPublic)  → redirect to /{locale} or /
    if (!isLoggedIn && !isPublic) → redirect to /auth/login?callbackUrl=pathname
    return intlMiddleware(req);
    ```

- [x] 🔴 **[AUTH]** Create `logoutAction` Server Action
  - Create new file: `src/lib/actions/logout.ts`
  - Use `signOut` from `@/auth` (server-side, NOT `next-auth/react`)
  - Redirect to locale-aware login page after logout
  - ```ts
    "use server";
    import { signOut } from "@/auth";
    import { getLocale } from "next-intl/server";
    export async function logoutAction() {
      const locale = await getLocale();
      const redirectTo = locale === "en" ? "/auth/login" : `/${locale}/auth/login`;
      await signOut({ redirectTo });
    }
    ```

- [x] 🔴 **[AUTH]** Create `LogoutButton` client component
  - Create new file: `src/components/auth/logout-button.tsx`
  - Use `<form action={logoutAction}>` — progressive enhancement, works before hydration
  - Accepts `displayName: string` prop
  - No `onClick`, no `signOut()` from `next-auth/react`

---

### Phase 2 — Performance & Architecture

- [x] 🟠 **[SIDEBAR]** Refactor `AppSidebar` to accept `session` prop
  - File: `src/components/app-sidebar.tsx`
  - Remove `useSession()` and `import { signOut, useSession } from "next-auth/react"`
  - Add `session: Session | null` to props interface
  - Replace `signOut()` onClick with `<LogoutButton displayName={...} />`
  - Keep `"use client"` — still needed for `usePathname()` and `Collapsible` state
  - **Before:**
    ```ts
    import { signOut, useSession } from "next-auth/react";
    const { data: session } = useSession(); // extra client subscription
    <SidebarMenuButton onClick={() => signOut()}>
    ```
  - **After:**
    ```ts
    import type { Session } from "next-auth";
    import { LogoutButton } from "@/components/auth/logout-button";
    export function AppSidebar({ session, ...props }: ... & { session: Session | null }) {
    <LogoutButton displayName={session.user?.name || ""} />
    ```

- [x] 🟠 **[LAYOUT]** Pass `session` prop to `AppSidebar` from layout
  - File: `src/app/[locale]/layout.tsx`
  - Change `<AppSidebar />` → `<AppSidebar session={session} />`
  - Session is already fetched via `await auth()` at line 58 — zero extra cost

- [ ] 🟠 **[LAYOUT]** Parallelize `auth()` and `getMessages()` fetches
  - File: `src/app/[locale]/layout.tsx`
  - Both are independent — run concurrently with `Promise.all`
  - **Before:**
    ```ts
    const session = await auth();
    // ... (other code)
    const messages = await getMessages();
    ```
  - **After:**
    ```ts
    const [session, messages] = await Promise.all([auth(), getMessages()]);
    ```

- [x] 🟠 **[LAYOUT]** Flatten provider nesting — move `Toaster` and `NuqsAdapter` outside `NextIntlClientProvider`
  - File: `src/app/[locale]/layout.tsx`
  - `Toaster` and `NuqsAdapter` have no dependency on translations — they are inside `NextIntlClientProvider` unnecessarily
  - **After order (outside-in):**
    ```
    SessionProvider
      QueryProvider
        Toaster          ← moved out
        NuqsAdapter      ← moved out
          NextIntlClientProvider
            TooltipProvider
              SidebarProvider
                AppSidebar + SidebarInset
    ```

---

### Phase 3 — i18n Optimization

- [x] 🟡 **[I18N]** Load only `Common` namespace globally in `request.ts`
  - File: `src/i18n/request.ts`
  - Currently loads all 3 namespaces (`Common`, `IndexPage`, `Auth`) on every request
  - Change to only load `Common` in the global config
  - **Before:**
    ```ts
    const messages = {
      Common: ...,
      IndexPage: ...,
      Auth: ...,
    };
    ```
  - **After:**
    ```ts
    const messages = {
      Common: (await import(`../../messages/${locale}/Common.json`)).default,
    };
    ```

- [x] 🟡 **[I18N]** Add per-scope namespace loading in page layouts
  - Create `src/app/[locale]/auth/layout.tsx` — loads `Auth` namespace
  - Create (or update) `src/app/[locale]/(dashboard)/layout.tsx` — loads `IndexPage` namespace
  - Use nested `<NextIntlClientProvider messages={{ Auth: authMessages }}>` so each scope only sends what it needs
  - Example for auth layout:
    ```ts
    export default async function AuthLayout({ children }) {
      const locale = await getLocale();
      const authMessages = (await import(`@/../messages/${locale}/Auth.json`)).default;
      return (
        <NextIntlClientProvider messages={{ Auth: authMessages }}>
          {children}
        </NextIntlClientProvider>
      );
    }
    ```

---

### Phase 4 — Minor Improvements

- [x] 🟢 **[AUTH]** Update `loginAction` to support `callbackUrl` redirect
  - File: `src/lib/actions/auth.ts`
  - Read `callbackUrl` from `formData` (set by Proxy on redirect)
  - Use it as `redirectTo` so users land back where they were after login
  - Rename export to `loginAction` for consistency with `logoutAction`
  - ```ts
    const callbackUrl = formData.get("callbackUrl") as string | null;
    const locale = await getLocale();
    const redirectTo = callbackUrl || (locale === "en" ? "/" : `/${locale}`);
    await signIn("credentials", { email, password, redirectTo });
    ```

- [x] 🟢 **[AUTH]** Update `LoginForm` to pass `callbackUrl` as hidden field
  - File: `src/components/auth/login-form.tsx`
  - Read `callbackUrl` from `useSearchParams()`
  - Add `<input type="hidden" name="callbackUrl" value={callbackUrl} />` inside the form

- [ ] 🟢 **[API]** Review `getLanguageAndToken` client-side path
  - File: `src/services/api/getLanguageAndToken.tsx`
  - Client path uses `getSession()` from `next-auth/react` which makes `GET /api/auth/session` on every API call
  - `getSession()` is cached after first call — verify this is working correctly
  - If called before hydration, consider passing the token explicitly at call sites instead

---

## Architecture Reference

### Final Provider Order (layout.tsx)

```
<SessionProvider session={session}>          ← server session pre-loaded
  <QueryProvider>                            ← React Query
    <Toaster />                              ← no intl dependency
    <NuqsAdapter>                            ← no intl dependency
      <NextIntlClientProvider messages={…}>  ← only Common namespace
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar session={session} /> ← session as prop, no useSession()
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </NextIntlClientProvider>
    </NuqsAdapter>
  </QueryProvider>
</SessionProvider>
```

### Auth Flow (Server Actions)

```
LoginForm (client)
  → useActionState(loginAction)
  → loginAction (server action)
    → signIn("credentials", { redirectTo })
    → NEXT_REDIRECT thrown → user lands on dashboard

LogoutButton (client, <form>)
  → form action={logoutAction}
  → logoutAction (server action)
    → signOut({ redirectTo: "/auth/login" })
    → NEXT_REDIRECT thrown → user lands on login
```

### Proxy Flow

```
Request comes in
  ├── isPublic + isLoggedIn  → redirect to /{locale}
  ├── !isPublic + !isLoggedIn → redirect to /auth/login?callbackUrl=pathname
  └── else                   → intlMiddleware(req) → page
```

---

## Files Changed / Created

| Action | File |
|--------|------|
| ✏️ Edit | `src/proxy.ts` |
| ✏️ Edit | `src/app/[locale]/layout.tsx` |
| ✏️ Edit | `src/components/app-sidebar.tsx` |
| ✏️ Edit | `src/lib/actions/auth.ts` |
| ✏️ Edit | `src/i18n/request.ts` |
| ✏️ Edit | `src/components/auth/login-form.tsx` |
| 🆕 Create | `src/lib/actions/logout.ts` |
| 🆕 Create | `src/components/auth/logout-button.tsx` |
| 🆕 Create | `src/app/[locale]/auth/layout.tsx` |

---

---

# Users Table — Integration Plan

> Source: `table-project/` (sadmann7/tablecn) · API: `jsons/users.ts`
> Stack: Next.js 16 App Router · React Query · next-intl · NextAuth v5 · nuqs · @tanstack/react-table

---

## Overview

Integrate the superior table component system from `table-project` into the main app and build a fully functional Users Table backed by the real REST API.

**Key decision:** Replace the existing `src/hooks/use-data-table.ts` and `src/components/data-table/` with the table-project versions — they are significantly more capable (per-column filter URL keys, multi-sort, column pinning, advanced filter mode, debouncing).

---

## Source Analysis

### table-project Data Flow

```
page.tsx (RSC)
  └─ searchParamsCache.parse(searchParams)   ← nuqs/server, typed schema
  └─ getTasks(search)                        ← data fetch (Drizzle in source; apiClient in our app)
  └─ Promise.all([...queries])               ← parallel, NOT awaited
  └─ <TasksTable promises={promises} />      ← Promise passed to client component
        └─ React.use(promises)               ← unwraps inside Suspense
        └─ useDataTable(...)                 ← React Table + nuqs per-column URL state
        └─ <DataTable table={table} />       ← pure render
```

### Key Differences vs Our Current System

| Concern | table-project | Our current app |
|---|---|---|
| Filter URL state | One key per column (`?status=active&gender=female`) | JSON blob (`?filters=[...]`) |
| Sort URL format | JSON array `[{"id":"createdAt","desc":true}]` | String `"createdAt.desc"` |
| `useDataTable` return | `{ table, shallow, debounceMs, throttleMs }` | `{ table, onDragEnd }` |
| Data source | Drizzle ORM → PostgreSQL | `apiClient()` → REST API |
| Server param parsing | `createSearchParamsCache` (nuqs/server) in RSC | Client-only parsers |
| Streaming | `React.use(Promise)` + Suspense | Not used |

---

## What to Reuse vs. Rewrite

### Copy directly from `table-project/src/` (zero or minimal changes)

```
components/data-table/data-table.tsx
components/data-table/data-table-toolbar.tsx
components/data-table/data-table-advanced-toolbar.tsx
components/data-table/data-table-column-header.tsx
components/data-table/data-table-filter-list.tsx
components/data-table/data-table-filter-menu.tsx
components/data-table/data-table-sort-list.tsx
components/data-table/data-table-faceted-filter.tsx
components/data-table/data-table-date-filter.tsx
components/data-table/data-table-slider-filter.tsx
components/data-table/data-table-view-options.tsx
components/data-table/data-table-pagination.tsx
components/data-table/data-table-skeleton.tsx
config/data-table.ts
lib/data-table.ts
lib/parsers.ts
types/data-table.ts
```

### Adapt (same concept, different wiring)

| File | Change needed |
|---|---|
| `hooks/use-data-table.ts` | Replace ours with table-project version. Rename `perPage` → `limit` to match our API. Remove drag-drop for now |
| `hooks/use-table-params.ts` | Update to match new per-column key format |
| `data-table-advanced-toolbar.tsx` | Strip feature-flag provider; expose as opt-in prop |

### Rewrite from scratch (Drizzle → REST API)

- Data fetching: `getTasks()` → `apiClient(USERS, { query })`
- Server actions: `createTask/updateTask` → `apiClient(USERS_CREATE/USERS_UPDATE, { body })`
- `searchParamsCache`: define per entity using API field names, not DB schema enums
- `validations.ts`: Zod schemas against API response types

---

## Proposed Folder Structure

```
src/
├─ components/
│  └─ data-table/                          ← migrated from table-project (shared, generic)
│     ├─ data-table.tsx
│     ├─ data-table-toolbar.tsx
│     ├─ data-table-advanced-toolbar.tsx
│     ├─ data-table-column-header.tsx
│     ├─ data-table-filter-list.tsx
│     ├─ data-table-filter-menu.tsx
│     ├─ data-table-sort-list.tsx
│     ├─ data-table-faceted-filter.tsx
│     ├─ data-table-date-filter.tsx
│     ├─ data-table-slider-filter.tsx
│     ├─ data-table-view-options.tsx
│     ├─ data-table-pagination.tsx
│     └─ data-table-skeleton.tsx
│
├─ hooks/
│  ├─ use-data-table.ts                    ← replaced with table-project version (adapted)
│  └─ use-table-params.ts                  ← updated for per-column filter keys
│
├─ lib/
│  ├─ data-table.ts                        ← new: getColumnPinningStyle, getFilterOperators, getValidFilters
│  └─ parsers.ts                           ← new: getSortingStateParser, getFiltersStateParser
│
├─ config/
│  └─ data-table.ts                        ← new: filterVariants, operators, joinOperators config
│
├─ types/
│  ├─ data-table.ts                        ← new: ColumnMeta augmentation, DataTableRowAction, QueryKeys
│  └─ table.ts                             ← keep existing (DataTableFilterField, DataTableAction, etc.)
│
└─ features/
   └─ users/
      ├─ types/
      │  └─ index.ts                       ← User, UserRole, UserPermission, UserActivityLog
      ├─ schemas/
      │  └─ index.ts                       ← usersSearchParamsCache, UsersSearchParams type
      └─ components/
         ├─ users-table.tsx                ← "use client" orchestrator (React.use + useDataTable)
         ├─ users-table-columns.tsx        ← getColumns() factory returning ColumnDef<User>[]
         ├─ users-table-toolbar-actions.tsx ← export CSV, create user button
         └─ users-table-action-bar.tsx     ← floating bar for bulk actions on selected rows

src/app/[locale]/(dashboard)/(user-management)/users/
   ├─ page.tsx                             ← RSC: parse params → fetch → Suspense → UsersTable
   ├─ error.tsx                            ← error boundary
   └─ loading.tsx                          ← secondary loading fallback
```

---

## Data Flow (after integration)

```
URL: /en/users?page=2&limit=10&sort=[{"id":"fullName","desc":false}]&status=active

page.tsx (RSC)
│
├─ usersSearchParamsCache.parse(await searchParams)
│    └─ { page: 2, limit: 10, sort: [{id:"fullName",desc:false}], status: ["active"] }
│
├─ apiClient(USERS, { query: { page, limit, sort: "fullName.asc", status: ["active"] } })
│    ├─ Injects: Authorization Bearer, X-Access-Api, lang headers (via getLanguageAndToken)
│    ├─ GET /api/v1/users?page=2&limit=10&sort=fullName.asc&status=active
│    └─ Returns: ApiResponse<PaginatedResponse<User>>
│
└─ <Suspense fallback={<DataTableSkeleton columnCount={9} />}>
     └─ <UsersTable promises={Promise.all([...])} />  ("use client")
           ├─ React.use(promises) → { data: User[], pageCount: number }
           ├─ getColumns({ setRowAction })
           ├─ useDataTable({ data, columns, pageCount, queryKeys: { perPage: "limit" } })
           │    ├─ useQueryState("page")
           │    ├─ useQueryState("sort")   ← JSON array format
           │    ├─ useQueryStates(filterParsers)  ← per-column: status, gender, fullName
           │    └─ returns { table, shallow, debounceMs, throttleMs }
           └─ <DataTable table={table}>
                 <DataTableToolbar>       ← reads column.meta.variant for filter UI
                   <DataTableSortList />
                 </DataTableToolbar>
                 <DataTablePagination />
              </DataTable>
```

**State update cycle** (user changes page):
```
User clicks "Next" → table.nextPage()
  → onPaginationChange → setPage(3) via nuqs
  → shallow: false → full RSC re-render
  → page.tsx re-runs → new apiClient call → new data
```

---

## TypeScript Types (`src/features/users/types/index.ts`)

```typescript
export interface UserRole {
  id: string
  name: { ar: string; en: string }
  guardName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserPermission {
  id: string
  permissionType: string
  displayName: { ar: string; en: string }
  guardName: string
}

export interface UserActivityLog {
  id: string
  user_id: string
  source_class_id: string | null
  target_class_id: string | null
  activity_type: string
  changed_by: string
  changed_by_user: { id: string; fullName: string }
  description: string | null
  createdAt: string
  target_class_name: { ar: string; en: string } | null
}

export interface User {
  id: string
  fullName: string
  email: string
  phone: string
  educationQualification: string | null
  nationalityId: string
  nationality: { id: string; name: string }
  userParentId: string | null
  status: "active" | "inactive" | "banned"
  gender: "male" | "female"
  graduationYear: string | null
  telegramCode: string | null
  fingerprint: string | null
  fingerprintStatus: boolean
  background_application: boolean
  add_to_home_screen: boolean
  notes: string | null
  countryId: string
  countryName: string
  birthDate: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  roles: UserRole[]
  permissions: UserPermission[]
  activityLogs: UserActivityLog[]
}
```

---

## Search Params Schema (`src/features/users/schemas/index.ts`)

```typescript
import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server"
import { getSortingStateParser } from "@/lib/parsers"
import type { User } from "../types"

export const usersSearchParamsCache = createSearchParamsCache({
  page:     parseAsInteger.withDefault(1),
  limit:    parseAsInteger.withDefault(10),
  sort:     getSortingStateParser<User>().withDefault([{ id: "createdAt", desc: true }]),
  fullName: parseAsString.withDefault(""),
  status:   parseAsArrayOf(parseAsStringEnum(["active", "inactive", "banned"])).withDefault([]),
  gender:   parseAsArrayOf(parseAsStringEnum(["male", "female"])).withDefault([]),
})

export type UsersSearchParams = Awaited<ReturnType<typeof usersSearchParamsCache.parse>>
```

---

## Column Definitions

| Column | `accessorKey` | Filter variant | Sortable | Notes |
|---|---|---|---|---|
| Select | — | — | No | Checkbox, `enableHiding: false` |
| Full Name | `fullName` | `text` | Yes | Truncated, search input |
| Email | `email` | `text` | Yes | Truncated |
| Phone | `phone` | — | No | Display only |
| Status | `status` | `multiSelect` | Yes | Badge: active / inactive / banned |
| Gender | `gender` | `multiSelect` | No | Badge: male / female |
| Country | `countryName` | — | No | Display only |
| Roles | `roles` | — | No | Badge list from `roles[].name.en` |
| Created At | `createdAt` | `dateRange` | Yes | Formatted date |
| Actions | — | — | No | Dropdown: View, Edit, Delete. Pinned right |

---

## API Query Param Mapping

```typescript
// Sort: nuqs JSON array → API string
function serializeSort(sort: ExtendedColumnSort<User>[]): string | undefined {
  const first = sort[0]
  if (!first) return undefined
  return `${first.id}.${first.desc ? "desc" : "asc"}`
  // Result: "fullName.asc"
}

// Full query object sent to apiClient
const query = {
  page:   search.page,
  limit:  search.limit,
  sort:   serializeSort(search.sort),
  ...(search.fullName          && { fullName: search.fullName }),
  ...(search.status.length > 0 && { status: search.status }),
  ...(search.gender.length > 0 && { gender: search.gender }),
}
```

---

## Step-by-Step Implementation Plan

### Phase 1 — Install table-project component system

- [ ] **1.1** Copy all `data-table/*` components from `table-project/src/components/data-table/` → `src/components/data-table/`
- [ ] **1.2** Copy `table-project/src/config/data-table.ts` → `src/config/data-table.ts`
- [ ] **1.3** Copy `table-project/src/lib/data-table.ts` → `src/lib/data-table.ts`
- [ ] **1.4** Copy `table-project/src/lib/parsers.ts` → `src/lib/parsers.ts`
- [ ] **1.5** Copy `table-project/src/types/data-table.ts` → `src/types/data-table.ts` (ColumnMeta augmentation)
- [ ] **1.6** Replace `src/hooks/use-data-table.ts` with table-project version — two changes: rename `perPage` URL key → `limit`; remove drag-drop code
- [ ] **1.7** Fix all import paths in copied files (they use `@/` which maps identically — should require zero changes)
- [ ] **1.8** Run `bun run lint` to catch any Biome issues (replace `// eslint-disable` with `// biome-ignore` if present)

### Phase 2 — Build Users feature module

- [ ] **2.1** Create `src/features/users/types/index.ts` — `User`, `UserRole`, `UserPermission`, `UserActivityLog` interfaces
- [ ] **2.2** Create `src/features/users/schemas/index.ts` — `usersSearchParamsCache`, `UsersSearchParams` type
- [ ] **2.3** Create `src/features/users/components/users-table-columns.tsx` — `getColumns({ setRowAction })` factory
  - Include: select, fullName (text filter), email (text filter), phone, status (multiSelect), gender (multiSelect), countryName, roles (badge list), createdAt (dateRange), actions (pinned right)
- [ ] **2.4** Create `src/features/users/components/users-table.tsx` (`"use client"`)
  - `React.use(promises)` to unwrap data
  - `useDataTable` with `queryKeys: { perPage: "limit" }`
  - Render `<DataTable>` + `<DataTableToolbar>` + `<DataTableSortList>`
  - Manage `rowAction` state for edit/delete modals
- [ ] **2.5** Create `src/features/users/components/users-table-action-bar.tsx` — bulk delete / export for selected rows

### Phase 3 — Wire the page

- [ ] **3.1** Update `src/app/[locale]/(dashboard)/(user-management)/users/page.tsx`:
  - Parse search params via `usersSearchParamsCache.parse(await searchParams)`
  - Call `apiClient(USERS, { query })` with `serializeSort()` transformer
  - Wrap in `<Suspense fallback={<DataTableSkeleton columnCount={9} />}>`
  - Pass `Promise.all([...])` (not awaited) to `<UsersTable>`
- [ ] **3.2** Create `src/app/[locale]/(dashboard)/(user-management)/users/error.tsx`
- [ ] **3.3** Create `src/app/[locale]/(dashboard)/(user-management)/users/loading.tsx`

### Phase 4 — i18n

- [ ] **4.1** Create `messages/en/Users.json` with keys: `columns.*`, `filters.*`, `actions.*`, `empty`, `deleteDialog.*`
- [ ] **4.2** Create `messages/ar/Users.json` with Arabic translations
- [ ] **4.3** Use `useTranslations("Users")` in `users-table-columns.tsx` for headers and badge labels
- [ ] **4.4** Load `Users` namespace in the users layout or via the existing namespace loading pattern

### Phase 5 — Verify & polish

- [ ] **5.1** Test pagination: URL updates, RSC re-fetches, correct page displayed
- [ ] **5.2** Test sorting: click column header → URL sort param → correct API call
- [ ] **5.3** Test filters: text filter debounce, multiSelect filter, dateRange filter
- [ ] **5.4** Test RTL (Arabic locale): audit column pinning, popover alignment, pagination layout
- [ ] **5.5** Test empty state, error state, loading skeleton
- [ ] **5.6** Test row actions: edit sheet, delete dialog, bulk selection action bar
- [ ] **5.7** Run `bun run build` — fix any type errors

---

## Pitfalls & Edge Cases

| Severity | Issue | Mitigation |
|---|---|---|
| 🔴 Critical | `shallow: false` required — without it, nuqs URL changes don't trigger RSC re-renders | Always set `shallow: false` in `useDataTable` |
| 🔴 Critical | Sort format mismatch — nuqs uses JSON array `[{id,desc}]`; API expects `"field.desc"` | Add `serializeSort()` transformer in RSC before `apiClient` call |
| 🔴 Critical | `perPage` vs `limit` URL key — table-project uses `perPage`; API uses `limit` | Set `queryKeys: { perPage: "limit" }` in every `useDataTable` call |
| 🔴 Critical | Never `await` the `Promise.all` in RSC — pass the Promise itself to the client | `const promises = Promise.all([...])` — no `await` |
| 🟠 High | `ColumnMeta` module augmentation must be picked up by TypeScript | Import `@/types/data-table` somewhere in the module graph, or add to `tsconfig.json` `types` |
| 🟠 High | API filter param names may differ from column `accessorKey` names | Verify against backend before wiring; map in RSC transformer if needed |
| 🟠 High | RTL: table-project components are LTR-only | Audit `left`/`right` CSS in pinning styles; use Tailwind `rtl:` variants |
| 🟡 Medium | `status` enum values — only `"active"` confirmed from sample data | Define conservatively; check swagger or test with backend |
| 🟡 Medium | `roles` is `UserRole[]` — cannot filter by role without a separate roles-list endpoint | Show as display-only badges in v1; add role filter in v2 |
| 🟡 Medium | `activityLogs[]` is heavy nested data — not suitable as a table column | Omit from table; show in detail drawer on row click |
| 🟡 Medium | Date strings lack timezone (`"2026-04-22T15:22:45.765"`) | Parse as `new Date(value + "Z")` to treat as UTC |
| 🟢 Low | Copied files may have `// eslint-disable` comments | Replace with `// biome-ignore lint/... <reason>` |
| 🟢 Low | Column visibility lost on page refresh (React state only) | Accept for v1; add `localStorage` persistence in v2 if needed |

---

## Files to Create / Edit

| Action | File |
|---|---|
| 🔄 Replace | `src/hooks/use-data-table.ts` |
| 🔄 Replace | `src/hooks/use-table-params.ts` |
| 🆕 Create | `src/components/data-table/data-table.tsx` |
| 🆕 Create | `src/components/data-table/data-table-toolbar.tsx` |
| 🆕 Create | `src/components/data-table/data-table-advanced-toolbar.tsx` |
| 🆕 Create | `src/components/data-table/data-table-column-header.tsx` |
| 🆕 Create | `src/components/data-table/data-table-filter-list.tsx` |
| 🆕 Create | `src/components/data-table/data-table-filter-menu.tsx` |
| 🆕 Create | `src/components/data-table/data-table-sort-list.tsx` |
| 🆕 Create | `src/components/data-table/data-table-faceted-filter.tsx` |
| 🆕 Create | `src/components/data-table/data-table-date-filter.tsx` |
| 🆕 Create | `src/components/data-table/data-table-slider-filter.tsx` |
| 🆕 Create | `src/components/data-table/data-table-view-options.tsx` |
| 🆕 Create | `src/components/data-table/data-table-pagination.tsx` |
| 🆕 Create | `src/components/data-table/data-table-skeleton.tsx` |
| 🆕 Create | `src/config/data-table.ts` |
| 🆕 Create | `src/lib/data-table.ts` |
| 🆕 Create | `src/lib/parsers.ts` |
| 🆕 Create | `src/types/data-table.ts` |
| 🆕 Create | `src/features/users/types/index.ts` |
| 🆕 Create | `src/features/users/schemas/index.ts` |
| 🆕 Create | `src/features/users/components/users-table.tsx` |
| 🆕 Create | `src/features/users/components/users-table-columns.tsx` |
| 🆕 Create | `src/features/users/components/users-table-action-bar.tsx` |
| ✏️ Edit | `src/app/[locale]/(dashboard)/(user-management)/users/page.tsx` |
| 🆕 Create | `src/app/[locale]/(dashboard)/(user-management)/users/error.tsx` |
| 🆕 Create | `src/app/[locale]/(dashboard)/(user-management)/users/loading.tsx` |
| 🆕 Create | `messages/en/Users.json` |
| 🆕 Create | `messages/ar/Users.json` |

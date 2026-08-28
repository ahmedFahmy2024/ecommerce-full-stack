<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Dashboard development guide

## Commands

Run commands from `dashboard/`:

```bash
bun run dev        # Local development server
bun run build      # Production build
bun run start      # Production server
bun run lint       # Biome check
bun run format     # Biome formatter (writes files)
bun run test       # API client tests
bun run typecheck  # TypeScript check
```

This project uses Biome, not ESLint or Prettier.

## Current architecture

- Next.js 16 App Router with React Compiler enabled. Pages are locale-scoped under `src/app/[locale]/` and localization is handled by `next-intl`.
- Supported locales are `en` (default) and `ar`; Arabic is RTL. Add translations in `messages/<locale>/<Namespace>.json` and register each namespace in `src/i18n/request.ts`.
- `src/features/` is intentionally empty following the dashboard refactor. Do not restore cloned education-domain pages, endpoint registries, or route constants from the old dashboard without an explicit product requirement.
- Reusable table and form primitives live in `src/components/data-table/` and `src/components/form/`. Shared table behavior lives in `src/hooks/use-data-table.ts` and `src/lib/table-query.ts`.

## Feature implementation and source research

Before implementing or changing a Next.js feature, research the applicable behavior instead of relying on remembered APIs:

1. Read the relevant Next.js guide in `node_modules/next/dist/docs/` and inspect the project's installed package versions in `package.json`.
2. Use `opensrc` first to inspect the exact source for Next.js and every library involved (for example, React, Zod, `next-intl`, TanStack Query, or React Hook Form). It resolves the installed version when run from `dashboard/`:

   ```bash
   opensrc path next --cwd .
   rg "useActionState" $(opensrc path react --cwd .)
   rg "z\.object" $(opensrc path zod --cwd .)
   ```

   Use the returned source path with `rg` or file-reading commands to confirm the supported API and implementation details before coding. If `opensrc` is unavailable, install it with `npm install -g opensrc`.
3. Use Context7 only if inspecting the installed source through opensrc does not answer the question. Prefer the source in the resolved version over generic examples or memory.

Favor current Next.js patterns when the feature supports them: Server Components by default, Client Components only where browser interactivity is needed, Server Actions for server-side mutations, and React's `use` / `useActionState` hooks where their documented semantics fit. Do not force a pattern where it conflicts with the existing API boundary, security model, or feature requirements.

Enforce the leaf rule from the first prompt: pages/layouts under `src/app` must remain Server Components (no `"use client"` on `page.tsx`/`layout.tsx`). Push `"use client"` + `useActionState`/`useState`/`useEffect` to the smallest leaf that actually needs browser APIs (e.g. `LoginForm.tsx` for `credentials: "include"`). If the leaf pattern is violated, the build ships unnecessary JS for static shells.

## API boundary and authentication

- All Nest backend HTTP requests must use `request`, `apiClient`, or an appropriate resource function from `@/services/api`. Do not call `fetch` against the backend in pages, features, or components.
- Do not read backend API environment variables outside `src/services/api/config.ts`; use its exported helpers instead.
- Browser authentication is direct-to-backend through `src/services/api/auth.ts`. Keep access tokens client-scoped in `session.client.ts`; never add server module-global token state, localStorage token storage, or a NextAuth Credentials transport.
- `src/proxy.ts` currently provides locale middleware only. It must not enforce authentication or permissions or call a guessed permissions endpoint. Backend authorization remains authoritative.
- Login/refresh must be client-leaf browser-direct (`services/api/auth.ts` via `transportFetch` with `credentials: "include"`). Never use a Server Action (`"use server"`) for Nest login — the Next server (3000→3001) cannot deliver Nest's `Set-Cookie: refresh_token; Path=/v1/auth/refresh; SameSite=Strict` to the browser. Keep the page Server, the form Client (`useActionState` from `react@19.2.8`).

## App Router file conventions (Next 16)

- File is `src/proxy.ts` (`export function proxy`) not `middleware.ts` — `middleware` is deprecated in Next 16. See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- `error.tsx` must be `"use client"` (error boundary), `loading.tsx`/`not-found.tsx` must be Server Components.
- `not-found.tsx`/`denied/page.tsx` must use `Link from "@/i18n/navigation"` not `next/link` to preserve `en|ar` prefix.
- `loading.tsx` must expose `role="status"`/`aria-busy`/`sr-only` for a11y.
- `error.tsx` must not render `error.message` verbatim — use normalized generic text; log via `console.error` only.

## Data tables

- Tables use server-controlled pagination, sorting, and filtering. Use `useDataTable` / `FeatureTableShell` rather than reimplementing URL synchronization.
- `FeatureTableShell` uses `shallow: false`, clears default values, and pins an `actions` column to the right by default.
- Add `"use no memo"` to a component that reads `table.getState()` or uses TanStack Table state directly; React Compiler auto-memoization otherwise breaks its internal state tracking.
- Server page queries should use `buildTableQuery` rather than manually constructing a `filters` payload.
- `src/lib/get-query-client.ts` must set `defaultOptions.queries.retry` to block `400/401/403/404/409/422/429` and `ABORTED` (see `query-core/src/retryer.ts:34` `RetryValue`). Never retry auth/validation/conflict.

## Definition of Done (first-prompt correctness)

Before marking any task done, verify from the first prompt:

1. `opensrc` source checked for every Next/library API touched (`opensrc path <pkg>` + `rg` against cached source) — no memory assumptions.
2. `bun run build` and `bun run typecheck` pass (Turbopack + no new `skipLibCheck` errors).
3. No `NEXT_PUBLIC_*` reads outside `src/services/api/config.ts`, no `fetch` outside `src/services/api/client.ts` + `transport.ts` + `auth.ts`.
4. Pages/layouts are Server by default; `"use client"` appears only on leaves that need it — `page.tsx` never carries it for static shells.

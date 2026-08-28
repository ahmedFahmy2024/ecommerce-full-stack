# SRP & Reusability Refactor — Education CRUD Modules

## Context

The CRUD feature modules under `src/features/` (categories, stages, batches, classes, materials) carry heavy duplication: each has its own `*-table.tsx`, `*-table-columns.tsx`, `*-table-action-bar.tsx`, and `*-form.tsx` that share 80–100% of their structure. Adding a new entity today means copy-pasting ~600 lines and changing a few names.

The goal is to extract small, composable **building blocks** (not mega-factories) that each feature's table/form files compose. Existing feature files stay as the public surface but become thin compositions. New pages will follow the same pattern from the start.

### Decisions already made (do not re-litigate)
- **Approach:** Building blocks only — no `EntityTable<T>` factory. Composition over configuration.
- **Migration scope:** Migrate all 5 existing features (categories, stages, batches, classes, materials).
- **Out of scope:** stages' `not_active` vs `inactive` enum mismatch, `*-edit-form.tsx` naming inconsistency, classes' cascading select logic.
- **Location:** New blocks live under `src/components/data-table/` and `src/components/form/` alongside existing siblings.

### What's already abstracted (do not duplicate or modify)
- `src/components/data-table/feature-table-shell.tsx`
- `src/components/data-table/action-drawer.tsx`
- `src/components/data-table/delete-row-dialog.tsx`
- `src/components/data-table/selection-action-bar.tsx`
- `src/components/data-table/row-actions-menu.tsx`
- `src/components/form/multi-step-form-shell.tsx`
- All `Custom*` field components in `src/components/form/`
- `src/hooks/use-data-table.ts`, `src/lib/table-query.ts`, `src/services/api/index.ts`

---

## Phase 1 — Build all new blocks (no behavioral change)

Land all blocks first; nothing imports them yet. `bun run lint` + `bun run build` must pass after this phase.

### 1.1 `<EntityTableActionBar>`

**Path:** `src/components/data-table/entity-table-action-bar.tsx`

Generic over `TData`. Caller passes a `label` function (so each feature keeps its i18n namespace). Optional `onDelete` and `children` for extra bulk actions. Default behavior matches today's `table.toggleAllRowsSelected(false)` so we don't introduce real deletion in this refactor.

```tsx
interface EntityTableActionBarProps<TData> {
  table: Table<TData>;
  label: (count: number) => string;
  onDelete?: (rows: Row<TData>[]) => void;
  deleteLabel?: string;
  children?: ReactNode;
}
```

Wraps `SelectionActionBar`. Does NOT call `useTranslations`.

### 1.2 `<EntityRowActions>`

**Path:** `src/components/data-table/entity-row-actions.tsx`

Replaces the `RowActions` sub-component at the bottom of every `*-table-columns.tsx`. Generic over `TData`. Receives a `routes` slice (e.g. `routes.categories`) instead of importing `@/constants/routes` directly — keeps the block decoupled from route topology.

```tsx
interface EntityRowActionsProps<TData> {
  row: Row<TData>;
  setRowAction: (action: DataTableRowAction<TData> | null) => void;
  actions: TableActionsConfig;
  getId: (data: TData) => string;
  routes: { view: (id: string) => string; edit: (id: string) => string };
  labels: { view: string; edit: string; delete: string };
}
```

Uses `useRouter` from `@/i18n/navigation` internally. Renders `<RowActionsMenu>` with items conditional on `actions` config. Does NOT call `useTranslations`.

### 1.3 `<EntityDrawerContent>`

**Path:** `src/components/data-table/entity-drawer-content.tsx`

Replaces the per-feature `DrawerContent` function inside `*-table.tsx`. Component (not hook) because the loading boilerplate is identical and worth absorbing too.

Generic over `TList` (row shape) and `TDetail` (fetched detail shape). Caller passes `renderForm` / `renderView` to control which form component is mounted (prop names differ per feature: `category={detail}` vs `stage={detail}` vs `cls={cls}`).

```tsx
interface EntityDrawerContentProps<TList, TDetail> {
  variant: "create" | "update" | "view";
  row: Row<TList> | null;
  detailEndpoint: string | null;   // null → skip fetch, pass row.original through
  getId: (data: TList) => string;
  renderForm: (detail?: TDetail) => ReactNode;
  renderView?: (detail: TDetail) => ReactNode;
  loadingLabel?: string;
}
```

Behavior:
- `variant === "create"` → `renderForm()`
- `variant === "update"` → if `detailEndpoint` is set, fetch via `apiClient`, show loading, then `renderForm(detail)`. If `null`, immediately call `renderForm(row.original as unknown as TDetail)`.
- `variant === "view"` → same fetch pattern, then `renderView?.(detail)`.

The `detailEndpoint={null}` opt-out is required for classes-table, which currently does NOT fetch detail (uses `row.original` directly).

### 1.4 Skip `<EntityTableLayout>`

Do NOT build a layout shell around `FeatureTableShell + ActionDrawer + DeleteRowDialog`. Once the three blocks above land, `*-table.tsx` drops to ~80 lines. A further shell would force 6+ props through and obscure rather than clarify — and classes-table's `materialId` filter logic doesn't fit a generic layout API anyway.

### 1.5 `<FormSection>`

**Path:** `src/components/form/form-section.tsx`

Replaces the `<section>` + `<h2>` + `<Separator />` + grid wrapper repeated 2–4 times per form (~13 instances total).

```tsx
interface FormSectionProps {
  title: string;
  description?: string;
  columns?: 1 | 2 | 3;   // default 2
  children: ReactNode;
  className?: string;
}
```

Renders the standard section markup. Caller controls `columns` — batches' and classes' Notes sections are `columns={1}`.

### 1.6 `<FormFooter>`

**Path:** `src/components/form/form-footer.tsx`

Replaces the submit + cancel button pair at the bottom of every CRUD form. All labels passed in (caller already has `t`).

```tsx
interface FormFooterProps {
  isSubmitting: boolean;
  isEdit: boolean;
  labels: {
    create: string;
    creating: string;
    update: string;
    updating: string;
    cancel: string;
  };
  onCancel?: () => void;
  align?: "start" | "end";   // default "start"
}
```

Cancel button only renders when `onCancel` is provided. Do NOT touch `material-form.tsx`'s footer (MultiStepFormShell owns it).

### 1.7 `useEntityFormSubmit` hook

**Path:** `src/components/form/use-entity-form-submit.ts`

Replaces the `if (isEdit) { apiClient(UPDATE, ...) } else { apiClient(CREATE, ...) }` block in every form.

```tsx
interface UseEntityFormSubmitOptions<TValues, TEntity, TBody = TValues> {
  entity?: TEntity;
  createEndpoint: string;
  updateEndpoint: string;
  getId: (entity: TEntity) => string;
  transform?: (values: TValues) => TBody;   // identity by default
  onSuccess?: () => void;
}

export function useEntityFormSubmit<TValues, TEntity, TBody = TValues>(
  opts: UseEntityFormSubmitOptions<TValues, TEntity, TBody>,
): (values: TValues) => Promise<void>;
```

The `transform` escape hatch handles batch-form's `notes: ... | undefined` cleanup and class-form's `notes` + `telegram_code` shaping. Do NOT try to make transform "smart."

### 1.8 `baseTableParsers` helper

**Path:** `src/lib/search-params.ts`

Returns the page/limit/sort/search parsers as a partial object that features spread into their `createSearchParamsCache`.

```tsx
import { parseAsInteger, parseAsString } from "nuqs/server";
import { getSortingStateParser } from "@/lib/parsers";

export function baseTableParsers<TRow>() {
  return {
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<TRow>().withDefault([]),
    search: parseAsString.withDefault(""),
  };
}
```

Usage in features:

```tsx
export const categoriesSearchParamsCache = createSearchParamsCache({
  ...baseTableParsers<Category>(),
  status: parseAsStringEnum(["active", "inactive"]).withDefault(null as unknown as "active"),
});
```

---

## Phase 2 — Pilot migration: categories

Migrate categories first to validate every block end-to-end before fanning out.

**Files modified:**
- [src/features/categories/components/categories-table-columns.tsx](src/features/categories/components/categories-table-columns.tsx): delete bottom-of-file `RowActions` sub-component; replace cell in actions column with `<EntityRowActions row={row} setRowAction={setRowAction} actions={actions} getId={(c) => c.id} routes={{ view: routes.categories.view, edit: routes.categories.edit }} labels={{ view: t("actions.view"), edit: t("actions.edit"), delete: t("actions.delete") }} />`. ~185 → ~120 lines.
- [src/features/categories/components/categories-table.tsx](src/features/categories/components/categories-table.tsx): delete `DrawerContent` function; replace `renderContent` callback with inline `<EntityDrawerContent variant={variant} row={row} detailEndpoint={CATEGORIES_DETAILS} getId={(c) => c.id} renderForm={(detail) => <CategoryForm category={detail} onSuccess={() => setRowAction(null)} />} renderView={(detail) => /* existing view JSX */} />`. ~179 → ~100 lines.
- [src/features/categories/components/categories-table-action-bar.tsx](src/features/categories/components/categories-table-action-bar.tsx): delete in Phase 6; for this phase, replace body with `<EntityTableActionBar table={table} label={(c) => t("actionBar.selected", { count: c })} deleteLabel={t("actionBar.delete")} />`.
- [src/features/categories/components/category-form.tsx](src/features/categories/components/category-form.tsx):
  - Wrap each `<section>` in `<FormSection title={t("sections.title")}>` / `<FormSection title={t("sections.details")}>`.
  - Replace footer with `<FormFooter isSubmitting={isSubmitting} isEdit={isEdit} labels={{ create: t("submit.create"), creating: t("submit.creating"), update: t("submit.update"), updating: t("submit.updating"), cancel: t("cancel") }} onCancel={() => onSuccess?.()} />`.
  - Replace submit logic with `const onSubmit = useEntityFormSubmit<CategoryFormValues, CategoryDetail>({ entity: category, createEndpoint: CATEGORIES_CREATE, updateEndpoint: CATEGORIES_UPDATE, getId: (c) => c.id, onSuccess });`.
  - ~122 → ~75 lines.
- [src/features/categories/schemas/index.ts](src/features/categories/schemas/index.ts): spread `baseTableParsers<Category>()` instead of inline page/limit/sort/search.

**Verify before moving on:** `bun run lint`, `bun run build`, then smoke test in dev (see Verification section).

---

## Phase 3 — Migrate stages and batches

Same template as categories. Run lint + build + smoke test after each module.

**Stages:**
- `src/features/stages/components/stages-table-columns.tsx`
- `src/features/stages/components/stages-table.tsx`
- `src/features/stages/components/stages-table-action-bar.tsx`
- `src/features/stages/components/stage-form.tsx` AND `stage-edit-form.tsx` (both get FormSection/FormFooter/useEntityFormSubmit)
- `src/features/stages/schemas/index.ts`

Note: stages uses `not_active` enum value. `EntityRowActions` doesn't care — labels are passed in. Leave the enum mismatch alone.

**Batches:**
- `src/features/batches/components/batches-table-columns.tsx`
- `src/features/batches/components/batches-table.tsx`
- `src/features/batches/components/batches-table-action-bar.tsx`
- `src/features/batches/components/batch-form.tsx` AND `batch-edit-form.tsx`
- `src/features/batches/schemas/index.ts`

Batch-form has a notes transform — pass it via `transform`:
```tsx
transform: (values) => ({
  ...values,
  notes: values.notes?.en || values.notes?.ar ? values.notes : undefined,
})
```

---

## Phase 4 — Migrate classes (preserve cascading select logic)

**Files modified:**
- `src/features/classes/components/classes-table-columns.tsx`: replace `RowActions` with `<EntityRowActions>`. Keep the hidden `materialId` column + filter logic intact.
- `src/features/classes/components/classes-table.tsx`:
  - Use `<EntityDrawerContent detailEndpoint={null} ...>` because classes doesn't fetch detail today. `renderForm` and `renderView` should accept the row directly.
  - **Do not touch:** `useQueryState("materialId", ...)`, `useMaterialsOptions`, `enableMaterials`, `initialState.columnVisibility.materialId: false`. These are class-specific and out of scope.
- `src/features/classes/components/classes-table-action-bar.tsx`: standard replacement.
- `src/features/classes/components/class-form.tsx`:
  - Wrap each section in `<FormSection>`. Notes section is `columns={1}`.
  - Replace footer with `<FormFooter>`.
  - Replace submit with `useEntityFormSubmit` + `transform` handling `notes` and `telegram_code` cleanup.
  - **Do not touch:** `useWatch` on `category_id`/`stage_id`, `prevCategoryIdRef` effects, `makeFetchStages`/`makeFetchBatches`. Cascading select logic stays as-is.
- `src/features/classes/schemas/index.ts`: spread `baseTableParsers<Class>()`.

---

## Phase 5 — Migrate materials (limited scope)

- `src/features/materials/components/materials-table-action-bar.tsx`: standard replacement.
- `src/features/materials/components/materials-table-columns.tsx`: replace `RowActions` with `<EntityRowActions>`.
- `src/features/materials/components/materials-table.tsx`: no `DrawerContent` exists (materials uses page mode, not drawer). Only update action bar import.
- `src/features/materials/components/material-form.tsx`: **DO NOT TOUCH.** Multi-step shell + useFieldArray + body shaping are entangled and out of scope.
- `src/features/materials/schemas/index.ts`: spread `baseTableParsers<Material>()` if shape matches.

---

## Phase 6 — Cleanup

Each `*-table-action-bar.tsx` is now a ~15-line wrapper around `<EntityTableActionBar>` whose only job is binding `t("actionBar.selected")` and `t("actionBar.delete")`. Inline that into `*-table.tsx` and **delete** the files:
- `src/features/categories/components/categories-table-action-bar.tsx`
- `src/features/stages/components/stages-table-action-bar.tsx`
- `src/features/batches/components/batches-table-action-bar.tsx`
- `src/features/classes/components/classes-table-action-bar.tsx`
- `src/features/materials/components/materials-table-action-bar.tsx`

Update imports in each `*-table.tsx`. Run `bun run lint` and `bun run build` as the final check.

---

## Critical files for implementation

- `src/components/data-table/entity-drawer-content.tsx` (new — the most subtle block; handles the fetch + null-endpoint opt-out)
- `src/components/data-table/entity-row-actions.tsx` (new)
- `src/components/form/use-entity-form-submit.ts` (new — the `transform` escape hatch is load-bearing)
- `src/features/categories/components/categories-table.tsx` (pilot — pattern for all `*-table.tsx`)
- `src/features/categories/components/category-form.tsx` (pilot — pattern for all `*-form.tsx`)
- `src/features/classes/components/classes-table.tsx` (verifies `detailEndpoint={null}` path)
- `src/features/classes/components/class-form.tsx` (verifies `transform` covers real-world cleanup)

---

## Risks & sharp edges

- **`"use no memo"` directives:** several current files declare this. New blocks that hold tanstack-table or react-hook-form state should also declare `"use no memo"` to remain consistent under React Compiler.
- **Generic inference:** `<EntityDrawerContent<Category, CategoryDetail>>` should infer cleanly, but if TS leaks `unknown`, pass explicit type args at the call site.
- **`detailEndpoint={null}` path:** must skip the `useEffect` entirely and not render the loading state — classes view drawer depends on this.
- **`materialId` column visibility on classes:** `initialState.columnVisibility.materialId: false` passed to `FeatureTableShell` must NOT be dropped during refactor.
- **Material form is untouched.** Resist the urge to apply `FormSection`/`FormFooter` to it — MultiStepFormShell already owns layout and footer.
- **`SelectionActionBar` already returns null when no rows are selected**, so `EntityTableActionBar` doesn't need to recheck.
- **`EntityRowActions` receives `routes` as a prop** — never import `@/constants/routes` inside the block.
- **`*-edit-form.tsx` files** get the same content refactor as `*-form.tsx`. Do NOT consolidate the file naming — out of scope.

---

## Verification

No test runner exists in this project, so verify end-to-end after each phase.

### After Phase 1 (blocks landed)
- `bun run lint` passes with zero new warnings.
- `bun run build` passes.
- No imports of new blocks yet — nothing should have changed behaviorally.

### After each migrated module (Phases 2–5)
1. `bun run lint`
2. `bun run build` — TS generics on `EntityDrawerContent` / `EntityRowActions` / `useEntityFormSubmit` are where breakage will surface.
3. `bun run dev` and manually walk the page:
   - List loads, columns render, status badge correct.
   - Click "Create" → drawer opens; submit → drawer closes, row appears.
   - Row menu → "Edit" → drawer opens with values pre-filled (network tab: detail endpoint fired); change a value, submit → row updates.
   - Row menu → "View" → drawer shows view JSX.
   - Row menu → "Delete" → confirm dialog; confirm → row removed.
   - Select multiple rows → action bar appears with count; destructive button visible.
   - Sort by a column → URL updates; refresh → sort persists.
   - Apply a status filter → URL updates; paginate to page 2 → filter persists.
4. Switch locale (en ↔ ar) on at least one migrated page — labels still resolve through the blocks.

### After Phase 4 (classes)
Additional check: cascading category → stage → batch selects still reset correctly when the parent changes. `prevCategoryIdRef` effect must fire.

### After Phase 6 (cleanup)
- Search for orphaned imports of deleted `*-table-action-bar.tsx` files (`bun run lint --fix`).
- Final `bun run lint` + `bun run build`.
- Smoke test all 5 pages one more time.
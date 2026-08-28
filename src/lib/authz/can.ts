import type { CrudPermissions, Permission } from "./permissions";

export type PermissionString = Permission;

export function can(
  permissions: Set<string> | string[] | null | undefined,
  required: Permission,
): boolean {
  if (!permissions) return false;
  if (permissions instanceof Set) return permissions.has(required);
  return permissions.includes(required);
}

export function canAny(
  permissions: Set<string> | string[] | null | undefined,
  required: Permission[],
): boolean {
  if (!permissions || required.length === 0) return false;
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  for (const p of required) {
    if (set.has(p)) return true;
  }
  return false;
}

export function canAll(
  permissions: Set<string> | string[] | null | undefined,
  required: Permission[],
): boolean {
  if (!permissions) return false;
  if (required.length === 0) return true;
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  for (const p of required) {
    if (!set.has(p)) return false;
  }
  return true;
}

export interface PermissionCheck {
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
}

/**
 * Single helper for declarative checks. Returns true if no rules are passed
 * (i.e. "no requirement" allows access). Combine rules with AND.
 */
export function evaluate(
  permissions: Set<string> | string[] | null | undefined,
  check: PermissionCheck,
): boolean {
  if (check.permission && !can(permissions, check.permission)) return false;
  if (check.anyOf && !canAny(permissions, check.anyOf)) return false;
  if (check.allOf && !canAll(permissions, check.allOf)) return false;
  return true;
}

export interface CrudActionsConfig {
  create: boolean;
  createMode: "page" | "drawer";
  edit: boolean;
  editMode: "page" | "drawer";
  delete: boolean;
  view: boolean;
  viewMode?: "page" | "drawer";
}

/**
 * Build a `TableActionsConfig`-shaped object from the user's permissions
 * and a resource's CRUD permission bundle. Modes default to "page".
 */
export function resolveCrudActions(
  permissions: Set<string> | string[] | null | undefined,
  crud: CrudPermissions,
  overrides: Partial<CrudActionsConfig> = {},
): CrudActionsConfig {
  return {
    create: can(permissions, crud.create),
    createMode: overrides.createMode ?? "page",
    edit: can(permissions, crud.update),
    editMode: overrides.editMode ?? "page",
    delete: can(permissions, crud.delete),
    view: crud.view ? can(permissions, crud.view) : false,
    viewMode: overrides.viewMode ?? "page",
    ...overrides,
  };
}

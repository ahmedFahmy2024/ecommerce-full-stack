import type { Permission } from "../types";

export type ActionType =
  | "VIEW"
  | "LIST"
  | "READ"
  | "CREATE"
  | "UPDATE"
  | "DELETE";

export const ACTION_ORDER: ActionType[] = [
  "VIEW",
  "LIST",
  "READ",
  "CREATE",
  "UPDATE",
  "DELETE",
];

const ACTION_SET = new Set<string>(ACTION_ORDER);

export interface PermissionEntry {
  permission: Permission;
  action: ActionType;
}

export interface ResourceGroup {
  key: string;
  label: string;
  entries: PermissionEntry[];
}

export interface GroupedPermissions {
  resources: ResourceGroup[];
  other: Permission[];
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Split `permissionType` into action + resource.
 * - Singletons (no underscore) → "Other".
 * - First token that isn't a known action → also "Other".
 * - Otherwise: first token = action, remaining tokens (joined, title-cased) = resource label.
 */
export function groupPermissions(
  permissions: Permission[],
): GroupedPermissions {
  const resourceMap = new Map<string, ResourceGroup>();
  const other: Permission[] = [];

  for (const permission of permissions) {
    const parts = permission.permissionType.split("_");
    if (parts.length < 2 || !ACTION_SET.has(parts[0])) {
      other.push(permission);
      continue;
    }

    const action = parts[0] as ActionType;
    const resourceKey = parts.slice(1).join("_");
    const resourceLabel = titleCase(parts.slice(1).join(" "));

    let group = resourceMap.get(resourceKey);
    if (!group) {
      group = { key: resourceKey, label: resourceLabel, entries: [] };
      resourceMap.set(resourceKey, group);
    }
    group.entries.push({ permission, action });
  }

  const resources = Array.from(resourceMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  for (const group of resources) {
    group.entries.sort(
      (a, b) => ACTION_ORDER.indexOf(a.action) - ACTION_ORDER.indexOf(b.action),
    );
  }

  return { resources, other };
}

export type PresetKey = "view" | "editor" | "full" | "clear";

const PRESET_ACTIONS: Record<PresetKey, ActionType[] | null> = {
  view: ["VIEW", "LIST", "READ"],
  editor: ["VIEW", "LIST", "READ", "CREATE", "UPDATE"],
  full: ["VIEW", "LIST", "READ", "CREATE", "UPDATE", "DELETE"],
  clear: null,
};

/**
 * Apply a preset against a resource group, returning the next selected-id set.
 * Only modifies ids belonging to this group; other ids in `selected` pass through.
 */
export function applyResourcePreset(
  group: ResourceGroup,
  preset: PresetKey,
  selected: Set<string>,
): Set<string> {
  const next = new Set(selected);
  const allowedActions = PRESET_ACTIONS[preset];

  for (const { permission, action } of group.entries) {
    if (allowedActions && allowedActions.includes(action)) {
      next.add(permission.id);
    } else {
      next.delete(permission.id);
    }
  }
  return next;
}

export function applyGlobalPreset(
  resources: ResourceGroup[],
  preset: PresetKey,
  selected: Set<string>,
  otherIdsToPreserve: Set<string>,
): Set<string> {
  const next = new Set<string>();
  for (const id of selected) {
    if (otherIdsToPreserve.has(id)) next.add(id);
  }
  const allowedActions = PRESET_ACTIONS[preset];
  if (!allowedActions) return next;
  for (const group of resources) {
    for (const { permission, action } of group.entries) {
      if (allowedActions.includes(action)) next.add(permission.id);
    }
  }
  return next;
}

import { evaluate } from "@/lib/authz/can";
import type { MenuItemProps } from "./menus";

/**
 * Return a copy of `items` with entries the current user cannot access removed.
 * Items with no `permission` field pass through. Parent items lose their
 * `items[]` filtered recursively; a parent with zero remaining children is
 * dropped unless it has its own `href` it can still navigate to.
 */
export function filterMenuItems(
  items: readonly MenuItemProps[],
  permissions: Set<string>,
): MenuItemProps[] {
  const result: MenuItemProps[] = [];
  for (const raw of items) {
    const item = raw as MenuItemProps;
    if (item.permission) {
      const check = Array.isArray(item.permission)
        ? { anyOf: item.permission }
        : { permission: item.permission };
      if (!evaluate(permissions, check)) continue;
    }
    let filteredChildren: MenuItemProps[] | undefined;
    if (item.items && item.items.length > 0) {
      filteredChildren = filterMenuItems(item.items, permissions);
      // If the parent only existed as a container for permission-gated
      // children and all of them are gone, drop the parent too.
      if (filteredChildren.length === 0 && !item.href) continue;
    }
    result.push({ ...item, items: filteredChildren });
  }
  return result;
}

export interface SidebarGroup {
  title: string;
  items: readonly MenuItemProps[];
}

export function filterSidebarGroups(
  groups: readonly SidebarGroup[],
  permissions: Set<string>,
): SidebarGroup[] {
  const result: SidebarGroup[] = [];
  for (const group of groups) {
    const items = filterMenuItems(group.items, permissions);
    if (items.length === 0) continue;
    result.push({ title: group.title, items });
  }
  return result;
}

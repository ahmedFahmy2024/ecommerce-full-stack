import "server-only";

import { redirect } from "next/navigation";

import type { CrudActionsConfig } from "./can";
import { resolveCrudActions } from "./can";
import type { CrudPermissions } from "./permissions";
import { getMyPermissions } from "./server";

/**
 * One-call page-level guard for CRUD list pages.
 *
 * - Redirects to /denied if the user lacks LIST permission for the resource.
 * - Returns a `TableActionsConfig`-compatible object reflecting create/edit/
 *   delete/view availability for the rest of the page to consume.
 *
 * Place at the top of any CRUD list page; the proxy already handles the URL
 * gate, but this stays defensive and keeps action visibility consistent.
 */
export async function gateCrudListPage(
  crud: CrudPermissions,
  overrides?: Partial<CrudActionsConfig>,
): Promise<{
  permissions: Set<string>;
  actions: CrudActionsConfig;
}> {
  const permissions = await getMyPermissions();
  if (!permissions.has(crud.list)) {
    redirect("/denied");
  }
  return {
    permissions,
    actions: resolveCrudActions(permissions, crud, overrides),
  };
}

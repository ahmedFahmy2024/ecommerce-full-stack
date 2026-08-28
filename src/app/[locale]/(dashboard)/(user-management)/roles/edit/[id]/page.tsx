import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { RoleForm } from "@/features/roles/components/role-form";
import type { Role } from "@/features/roles/types";
import apiClient from "@/services/api";
import { ROLES_DETAILS } from "@/services/api/queries";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Roles.form");

  const res = await apiClient<Role>(ROLES_DETAILS, { params: { id } });

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title={t("editTitle")} />
      <RoleForm role={res.data} />
    </div>
  );
}

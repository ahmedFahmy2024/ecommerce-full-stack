import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { RoleForm } from "@/features/roles/components/role-form";

export default async function CreateRolePage() {
  const t = await getTranslations("Roles.form");

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title={t("createTitle")} />
      <RoleForm />
    </div>
  );
}

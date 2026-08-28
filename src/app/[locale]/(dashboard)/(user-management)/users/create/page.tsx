import { getTranslations } from "next-intl/server";

import { EntityFormPage } from "@/components/layout/entity-form-page";
import { UserForm } from "@/features/users/components/user-form";

export default async function CreateUsersPage() {
  const t = await getTranslations("Users.form");

  return (
    <EntityFormPage title={t("createTitle")}>
      <UserForm />
    </EntityFormPage>
  );
}

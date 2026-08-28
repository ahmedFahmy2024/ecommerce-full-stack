import { getTranslations } from "next-intl/server";

import { EntityFormPage } from "@/components/layout/entity-form-page";
import { UserForm } from "@/features/users/components/user-form";
import type { User } from "@/features/users/types";
import apiClient from "@/services/api";
import { USERS_DETAILS } from "@/services/api/queries";

export default async function EditUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Users.form");

  const res = await apiClient<User>(USERS_DETAILS, { params: { id } });

  return (
    <EntityFormPage title={t("editTitle")}>
      <UserForm user={res.data} />
    </EntityFormPage>
  );
}

import { getTranslations } from "next-intl/server";

import { EntityFormPage } from "@/components/layout/entity-form-page";
import { MaterialForm } from "@/features/materials/components/material-form";

export default async function CreateMaterialPage() {
  const t = await getTranslations("Materials.form");

  return (
    <EntityFormPage title={t("createTitle")}>
      <MaterialForm />
    </EntityFormPage>
  );
}

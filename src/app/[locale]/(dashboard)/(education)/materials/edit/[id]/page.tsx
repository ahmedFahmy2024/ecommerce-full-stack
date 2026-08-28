import { getTranslations } from "next-intl/server";

import { EntityFormPage } from "@/components/layout/entity-form-page";
import { MaterialForm } from "@/features/materials/components/material-form";
import type { MaterialDetailed } from "@/features/materials/types";
import apiClient from "@/services/api";
import { MATERIALS_DETAILS } from "@/services/api/queries";

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Materials.form");

  const res = await apiClient<MaterialDetailed>(MATERIALS_DETAILS, {
    params: { id },
  });

  return (
    <EntityFormPage title={t("editTitle")}>
      <MaterialForm material={res.data} />
    </EntityFormPage>
  );
}

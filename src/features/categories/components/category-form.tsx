"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  CustomInput,
  CustomSelect,
  FormFooter,
  FormSection,
  useEntityFormSubmit,
} from "@/components/form";
import { CATEGORIES_CREATE, CATEGORIES_UPDATE } from "@/services/api/queries";
import {
  type CategoryFormValues,
  makeCategoryFormSchema,
} from "../schemas/form";
import type { CategoryDetail } from "../types";

interface CategoryFormProps {
  category?: CategoryDetail;
  onSuccess?: () => void;
}

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  "use no memo";

  const t = useTranslations("Categories.form");
  const tStatus = useTranslations("Categories.status");
  const isEdit = !!category;

  const schema = React.useMemo(
    () => makeCategoryFormSchema(t as (k: string) => string),
    [t],
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: { en: category?.title.en ?? "", ar: category?.title.ar ?? "" },
      status: category?.status ?? "active",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const statusOptions = [
    { label: tStatus("active"), value: "active" },
    { label: tStatus("inactive"), value: "inactive" },
  ];

  const onSubmit = useEntityFormSubmit<CategoryFormValues, CategoryDetail>({
    entity: category,
    createEndpoint: CATEGORIES_CREATE,
    updateEndpoint: CATEGORIES_UPDATE,
    getId: (c) => c.id,
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormSection title={t("sections.title")}>
        <CustomInput
          control={control}
          name="title.en"
          label={t("fields.titleEn")}
          placeholder={t("fields.titleEnPlaceholder")}
          required
        />
        <CustomInput
          control={control}
          name="title.ar"
          label={t("fields.titleAr")}
          placeholder={t("fields.titleArPlaceholder")}
          required
        />
      </FormSection>

      <FormSection title={t("sections.details")}>
        <CustomSelect
          control={control}
          name="status"
          label={t("fields.status")}
          placeholder={t("fields.statusPlaceholder")}
          options={statusOptions}
          required
        />
      </FormSection>

      <FormFooter
        isSubmitting={isSubmitting}
        isEdit={isEdit}
        labels={{
          create: t("submit.create"),
          creating: t("submit.creating"),
          update: t("submit.update"),
          updating: t("submit.updating"),
          cancel: t("cancel"),
        }}
        onCancel={() => onSuccess?.()}
      />
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  CustomInfiniteCombobox,
  CustomInput,
  CustomSelect,
  FormFooter,
  FormSection,
  useEntityFormSubmit,
} from "@/components/form";
import apiClient from "@/services/api";
import {
  CATEGORIES,
  STAGES_CREATE,
  STAGES_UPDATE,
} from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/pagination";
import { makeStageFormSchema, type StageFormValues } from "../schemas/form";
import type { StageDetail } from "../types";

/** Shape of items from GET /categories (list) */
interface CategoryListItem {
  id: string;
  title: string;
}

async function fetchCategories({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}) {
  const res = await apiClient<PaginatedResponse<CategoryListItem>>(CATEGORIES, {
    query: { page, limit, ...(search ? { search } : {}) },
  });
  return { items: res.data.items, hasNextPage: res.data.meta.hasNextPage };
}

interface StageFormProps {
  stage?: StageDetail;
  onSuccess?: () => void;
}

export function StageForm({ stage, onSuccess }: StageFormProps) {
  "use no memo";

  const t = useTranslations("Stages.form");
  const tStatus = useTranslations("Stages.status");
  const isEdit = !!stage;

  const schema = React.useMemo(
    () => makeStageFormSchema(t as (k: string) => string),
    [t],
  );

  const form = useForm<StageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: { en: stage?.title.en ?? "", ar: stage?.title.ar ?? "" },
      status: stage?.status ?? "active",
      category_id: stage?.category?.id ?? "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const statusOptions = [
    { label: tStatus("active"), value: "active" },
    { label: tStatus("not_active"), value: "not_active" },
  ];

  const onSubmit = useEntityFormSubmit<StageFormValues, StageDetail>({
    entity: stage,
    createEndpoint: STAGES_CREATE,
    updateEndpoint: STAGES_UPDATE,
    getId: (s) => s.id,
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
        <CustomInfiniteCombobox<CategoryListItem, StageFormValues>
          control={control}
          name="category_id"
          label={t("fields.category")}
          placeholder={t("fields.categoryPlaceholder")}
          queryKey={["categories-combobox"]}
          queryFn={fetchCategories}
          getLabel={(c) => c.title}
          getValue={(c) => c.id}
          initialLabel={
            stage?.category
              ? stage.category.title.ar || stage.category.title.en
              : undefined
          }
          enableSearch
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

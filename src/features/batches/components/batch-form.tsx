"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  CustomInfiniteCombobox,
  CustomInput,
  CustomSelect,
  CustomTextarea,
  FormFooter,
  FormSection,
  useEntityFormSubmit,
} from "@/components/form";
import apiClient from "@/services/api";
import {
  BATCHES_CREATE,
  BATCHES_UPDATE,
  CATEGORIES,
  STAGES,
} from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";
import { type BatchFormValues, makeBatchFormSchema } from "../schemas/form";
import type { BatchDetail } from "../types";

/** Items from GET /categories list — title is a plain string */
interface CategoryListItem {
  id: string;
  title: string;
}

/** Items from GET /stages list — title is a plain string */
interface StageListItem {
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

function makeFetchStages(categoryId: string) {
  return async ({
    page,
    limit,
    search,
  }: {
    page: number;
    limit: number;
    search?: string;
  }) => {
    const res = await apiClient<PaginatedResponse<StageListItem>>(STAGES, {
      query: {
        page,
        limit,
        ...(search ? { search } : {}),
        filters: JSON.stringify({ category_id: categoryId }),
      },
    });
    return { items: res.data.items, hasNextPage: res.data.meta.hasNextPage };
  };
}

interface BatchFormProps {
  batch?: BatchDetail;
  onSuccess?: () => void;
}

export function BatchForm({ batch, onSuccess }: BatchFormProps) {
  "use no memo";

  const t = useTranslations("Batches.form");
  const tStatus = useTranslations("Batches.status");
  const isEdit = !!batch;

  const schema = React.useMemo(
    () => makeBatchFormSchema(t as (k: string) => string),
    [t],
  );

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: { en: batch?.title.en ?? "", ar: batch?.title.ar ?? "" },
      status: batch?.status ?? "active",
      notes: { en: batch?.notes?.en ?? "", ar: batch?.notes?.ar ?? "" },
      category_id: batch?.category?.id ?? "",
      stage_id: batch?.stage?.id ?? "",
    },
  });

  const {
    control,
    handleSubmit,
    resetField,
    formState: { isSubmitting },
  } = form;

  const categoryId = useWatch({ control, name: "category_id" });

  const prevCategoryIdRef = React.useRef(categoryId);

  React.useEffect(() => {
    if (prevCategoryIdRef.current !== categoryId) {
      prevCategoryIdRef.current = categoryId;
      resetField("stage_id", { defaultValue: "" });
    }
  }, [categoryId, resetField]);

  const fetchStagesFn = React.useMemo(
    () => makeFetchStages(categoryId),
    [categoryId],
  );

  const statusOptions = [
    { label: tStatus("active"), value: "active" },
    { label: tStatus("inactive"), value: "inactive" },
    { label: tStatus("pending"), value: "pending" },
    { label: tStatus("finished"), value: "finished" },
    { label: tStatus("deleted"), value: "deleted" },
  ];

  const onSubmit = useEntityFormSubmit<BatchFormValues, BatchDetail>({
    entity: batch,
    createEndpoint: BATCHES_CREATE,
    updateEndpoint: BATCHES_UPDATE,
    getId: (b) => b.id,
    transform: (values) => ({
      ...values,
      notes: values.notes?.en || values.notes?.ar ? values.notes : undefined,
    }),
    onSuccess,
  });

  const categoryInitialLabel = batch?.category
    ? batch.category.title.ar || batch.category.title.en
    : undefined;

  const stageInitialLabel = batch?.stage
    ? batch.stage.title.ar || batch.stage.title.en
    : undefined;

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

      <FormSection title={t("sections.relations")}>
        <CustomInfiniteCombobox<CategoryListItem, BatchFormValues>
          control={control}
          name="category_id"
          label={t("fields.category")}
          placeholder={t("fields.categoryPlaceholder")}
          queryKey={["categories-combobox"]}
          queryFn={fetchCategories}
          getLabel={(c) => c.title}
          getValue={(c) => c.id}
          initialLabel={categoryInitialLabel}
          enableSearch
          required
        />
        <CustomInfiniteCombobox<StageListItem, BatchFormValues>
          control={control}
          name="stage_id"
          label={t("fields.stage")}
          placeholder={
            categoryId
              ? t("fields.stagePlaceholder")
              : t("fields.stageDisabledPlaceholder")
          }
          queryKey={["stages-combobox", categoryId]}
          queryFn={fetchStagesFn}
          getLabel={(s) => s.title}
          getValue={(s) => s.id}
          initialLabel={stageInitialLabel}
          enableSearch
          disabled={!categoryId}
          required
        />
      </FormSection>

      <FormSection title={t("sections.notes")} columns={1}>
        <CustomTextarea
          control={control}
          name="notes.en"
          label={t("fields.notesEn")}
          placeholder={t("fields.notesEnPlaceholder")}
          rows={3}
        />
        <CustomTextarea
          control={control}
          name="notes.ar"
          label={t("fields.notesAr")}
          placeholder={t("fields.notesArPlaceholder")}
          rows={3}
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

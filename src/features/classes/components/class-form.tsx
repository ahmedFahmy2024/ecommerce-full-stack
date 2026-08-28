"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  CustomInfiniteCombobox,
  CustomInput,
  CustomNumberInput,
  CustomSelect,
  CustomTextarea,
  FormFooter,
  FormSection,
  useEntityFormSubmit,
} from "@/components/form";
import apiClient from "@/services/api";
import {
  BATCHES,
  CATEGORIES,
  CLASSES_CREATE,
  CLASSES_UPDATE,
  STAGES,
} from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";
import { type ClassFormValues, makeClassFormSchema } from "../schemas/form";
import type { Class, ClassBatch, ClassCategory, ClassStage } from "../types";

async function fetchCategories({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}) {
  const res = await apiClient<PaginatedResponse<ClassCategory>>(CATEGORIES, {
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
    const res = await apiClient<PaginatedResponse<ClassStage>>(STAGES, {
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

function makeFetchBatches(categoryId: string, stageId: string) {
  return async ({
    page,
    limit,
    search,
  }: {
    page: number;
    limit: number;
    search?: string;
  }) => {
    const res = await apiClient<PaginatedResponse<ClassBatch>>(BATCHES, {
      query: {
        page,
        limit,
        ...(search ? { search } : {}),
        filters: JSON.stringify({
          category_id: categoryId,
          stage_id: stageId,
        }),
      },
    });
    return { items: res.data.items, hasNextPage: res.data.meta.hasNextPage };
  };
}

interface ClassFormProps {
  cls?: Class;
  onSuccess?: () => void;
}

export function ClassForm({ cls, onSuccess }: ClassFormProps) {
  "use no memo";

  const t = useTranslations("Classes.form");
  const tGender = useTranslations("Classes.gender");
  const tStatus = useTranslations("Classes.status");
  const isEdit = !!cls;

  const schema = React.useMemo(
    () => makeClassFormSchema(t as (k: string) => string),
    [t],
  );

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: { en: cls?.name.en ?? "", ar: cls?.name.ar ?? "" },
      notes: { en: cls?.notes?.en ?? "", ar: cls?.notes?.ar ?? "" },
      gender: cls?.gender,
      status: cls?.status,
      telegram_code: cls?.telegram_code ?? "",
      category_id: cls?.category?.id ?? "",
      stage_id: cls?.stage?.id ?? "",
      batch_id: cls?.batch?.id ?? "",
      limit_sound: cls?.limit_sound ?? null,
    },
  });

  const {
    control,
    handleSubmit,
    resetField,
    formState: { isSubmitting },
  } = form;

  const categoryId = useWatch({ control, name: "category_id" });
  const stageId = useWatch({ control, name: "stage_id" });

  const prevCategoryIdRef = React.useRef(categoryId);
  const prevStageIdRef = React.useRef(stageId);

  React.useEffect(() => {
    if (prevCategoryIdRef.current !== categoryId) {
      prevCategoryIdRef.current = categoryId;
      resetField("stage_id", { defaultValue: "" });
      resetField("batch_id", { defaultValue: "" });
    }
  }, [categoryId, resetField]);

  React.useEffect(() => {
    if (prevStageIdRef.current !== stageId) {
      prevStageIdRef.current = stageId;
      resetField("batch_id", { defaultValue: "" });
    }
  }, [stageId, resetField]);

  const fetchStagesFn = React.useMemo(
    () => makeFetchStages(categoryId),
    [categoryId],
  );
  const fetchBatchesFn = React.useMemo(
    () => makeFetchBatches(categoryId, stageId),
    [categoryId, stageId],
  );

  const onSubmit = useEntityFormSubmit<ClassFormValues, Class>({
    entity: cls,
    createEndpoint: CLASSES_CREATE,
    updateEndpoint: CLASSES_UPDATE,
    getId: (c) => c.id,
    transform: (values) => ({
      ...values,
      notes: values.notes?.en || values.notes?.ar ? values.notes : undefined,
      telegram_code: values.telegram_code || undefined,
    }),
    onSuccess,
  });

  const genderOptions = [
    { label: tGender("male"), value: "male" },
    { label: tGender("female"), value: "female" },
    { label: tGender("both"), value: "both" },
  ];

  const statusOptions = [
    { label: tStatus("active"), value: "active" },
    { label: tStatus("not_active"), value: "not_active" },
    { label: tStatus("pending"), value: "pending" },
    { label: tStatus("finished"), value: "finished" },
    { label: tStatus("deleted"), value: "deleted" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormSection title={t("sections.name")}>
        <CustomInput
          control={control}
          name="name.en"
          label={t("fields.nameEn")}
          placeholder={t("fields.nameEnPlaceholder")}
          required
        />
        <CustomInput
          control={control}
          name="name.ar"
          label={t("fields.nameAr")}
          placeholder={t("fields.nameArPlaceholder")}
          required
        />
      </FormSection>

      <FormSection title={t("sections.details")}>
        <CustomSelect
          control={control}
          name="gender"
          label={t("fields.gender")}
          placeholder={t("fields.genderPlaceholder")}
          options={genderOptions}
          required
        />
        <CustomSelect
          control={control}
          name="status"
          label={t("fields.status")}
          placeholder={t("fields.statusPlaceholder")}
          options={statusOptions}
          required
        />
        <CustomInput
          control={control}
          name="telegram_code"
          label={t("fields.telegramCode")}
          placeholder={t("fields.telegramCodePlaceholder")}
        />
        <CustomNumberInput
          control={control}
          name="limit_sound"
          label={t("fields.limitSound")}
          placeholder={t("fields.limitSoundPlaceholder")}
          min={0}
        />
      </FormSection>

      <FormSection title={t("sections.relations")}>
        <CustomInfiniteCombobox<ClassCategory, ClassFormValues>
          control={control}
          name="category_id"
          label={t("fields.category")}
          placeholder={t("fields.categoryPlaceholder")}
          queryKey={["categories-combobox"]}
          queryFn={fetchCategories}
          getLabel={(c) => c.title}
          getValue={(c) => c.id}
          initialLabel={cls?.category?.title}
          enableSearch
          required
        />
        <CustomInfiniteCombobox<ClassStage, ClassFormValues>
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
          initialLabel={cls?.stage?.title}
          enableSearch
          disabled={!categoryId}
          required
        />
        <CustomInfiniteCombobox<ClassBatch, ClassFormValues>
          control={control}
          name="batch_id"
          label={t("fields.batch")}
          placeholder={
            stageId
              ? t("fields.batchPlaceholder")
              : t("fields.batchDisabledPlaceholder")
          }
          queryKey={["batches-combobox", categoryId, stageId]}
          queryFn={fetchBatchesFn}
          getLabel={(b) => b.title}
          getValue={(b) => b.id}
          initialLabel={cls?.batch?.title}
          enableSearch
          disabled={!stageId}
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

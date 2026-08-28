"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { type Control, useFieldArray } from "react-hook-form";

import {
  CustomInfiniteCombobox,
  CustomInput,
  CustomNumberInput,
  CustomSelect,
  CustomSwitch,
  CustomTextarea,
  EntityFormShell,
  type MultiStepFormStep,
  useEntityForm,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import { routes } from "@/constants/routes";
import { useRouter } from "@/i18n/navigation";
import {
  type ComboboxFetcherEntity,
  getEntityLabel,
  makeComboboxFetcher,
} from "@/lib/combobox-fetcher";
import {
  BATCHES,
  CLASSES,
  INSTRUCTORS,
  MATERIALS_CREATE,
  MATERIALS_UPDATE,
  QUIZZES,
  STAGES,
  SUPERVISORS,
} from "@/services/api/queries";
import {
  type MaterialDetailFormValues,
  type MaterialFormValues,
  makeMaterialFormSchema,
} from "../schemas/form";
import type { MaterialDetailed } from "../types";

const fetchInstructors = makeComboboxFetcher<ComboboxFetcherEntity>(INSTRUCTORS);
const fetchSupervisors = makeComboboxFetcher<ComboboxFetcherEntity>(SUPERVISORS);
const fetchStages = makeComboboxFetcher<ComboboxFetcherEntity>(STAGES);
const fetchBatches = makeComboboxFetcher<ComboboxFetcherEntity>(BATCHES);
const fetchClasses = makeComboboxFetcher<ComboboxFetcherEntity>(CLASSES);
const fetchQuizzes = makeComboboxFetcher<ComboboxFetcherEntity>(QUIZZES);

interface MaterialFormProps {
  material?: MaterialDetailed;
}

interface MaterialFormBody {
  title: MaterialFormValues["title"];
  description: MaterialFormValues["description"] | null;
  cover_id: string | undefined;
  policies: Record<string, unknown>;
  demoVideo: string | undefined;
  attachments: string[] | undefined;
  materialDetail: MaterialDetailFormValues[];
}

const initialDetail: MaterialDetailFormValues = {
  type: "live",
  material_type: "subject",
  instructor_id: null,
  supervisor_id: null,
  stage_id: null,
  batch_id: null,
  class_id: null,
  telegram_code: null,
  start_date: null,
  end_date: null,
  evaluation_form_id: null,
  attend_form_id: null,
  quiz_form_id: null,
  count_session: null,
  duration_btw_test: null,
  max_attempt: null,
  close_quiz_after_hours: null,
  close_eval_after_hours: null,
  close_attend_after_hours: null,
  send_live_link_before_hours: null,
  show_total_result: false,
  show_result_attendance: false,
  show_evaluation: false,
  show_quiz: false,
  allow_result_to_instructor: false,
  allow_result_to_supervisor: false,
  isActive: true,
};

export function MaterialForm({ material }: MaterialFormProps) {
  "use no memo";

  const t = useTranslations("Materials.form");
  const tSteps = useTranslations("Materials.form.steps");
  const tDetailType = useTranslations("Materials.materialDetailType");
  const tMaterialType = useTranslations("Materials.materialType");
  const router = useRouter();

  const schema = React.useMemo(
    () => makeMaterialFormSchema(t as (k: string) => string),
    [t],
  );

  const { form, onSubmit, isEdit, isSubmitting } = useEntityForm<
    MaterialFormValues,
    MaterialDetailed,
    MaterialFormBody
  >({
    entity: material,
    schema,
    formOptions: { reValidateMode: "onBlur" },
    defaultValues: (m) => ({
      title: {
        en: m?.title.en ?? "",
        ar: m?.title.ar ?? "",
      },
      description: {
        en: m?.description?.en ?? "",
        ar: m?.description?.ar ?? "",
      },
      cover_id: m?.cover?.id ?? "",
      demoVideo: m?.demoVideo ?? "",
      attachments: m?.attachments?.map((a) => a.id) ?? [],
      materialDetail:
        m?.materialDetail && m.materialDetail.length > 0
          ? m.materialDetail.map((d) => ({
              type: d.type,
              material_type: d.material_type,
              instructor_id: d.instructor_id,
              supervisor_id: d.supervisor_id,
              stage_id: d.stage_id,
              batch_id: d.batch_id,
              class_id: d.class_id,
              telegram_code: d.telegram_code,
              start_date: d.start_date,
              end_date: d.end_date,
              evaluation_form_id: d.evaluation_form_id,
              attend_form_id: d.attend_form_id,
              quiz_form_id: d.quiz_form_id,
              count_session: d.count_session,
              duration_btw_test: d.duration_btw_test,
              max_attempt: d.max_attempt,
              close_quiz_after_hours: d.close_quiz_after_hours,
              close_eval_after_hours: d.close_eval_after_hours,
              close_attend_after_hours: d.close_attend_after_hours,
              send_live_link_before_hours: d.send_live_link_before_hours,
              show_total_result: d.show_total_result ?? false,
              show_result_attendance: d.show_result_attendance ?? false,
              show_evaluation: d.show_evaluation ?? false,
              show_quiz: d.show_quiz ?? false,
              allow_result_to_instructor: d.allow_result_to_instructor ?? false,
              allow_result_to_supervisor: d.allow_result_to_supervisor ?? false,
              isActive: d.isActive,
            }))
          : [initialDetail],
    }),
    createEndpoint: MATERIALS_CREATE,
    updateEndpoint: MATERIALS_UPDATE,
    getId: (m) => m.id,
    transform: (values) => ({
      title: values.title,
      description:
        values.description?.en || values.description?.ar
          ? values.description
          : null,
      cover_id: values.cover_id || undefined,
      policies: {},
      demoVideo: values.demoVideo || undefined,
      attachments: values.attachments?.length ? values.attachments : undefined,
      materialDetail: values.materialDetail.map((d) => ({
        ...d,
        instructor_id: d.instructor_id || undefined,
        supervisor_id: d.supervisor_id || undefined,
        stage_id: d.stage_id || undefined,
        batch_id: d.batch_id || undefined,
        class_id: d.class_id || undefined,
        telegram_code: d.telegram_code || undefined,
        start_date: d.start_date || undefined,
        end_date: d.end_date || undefined,
        evaluation_form_id: d.evaluation_form_id || undefined,
        attend_form_id: d.attend_form_id || undefined,
        quiz_form_id: d.quiz_form_id || undefined,
      })),
    }),
    onSuccess: () => router.push(routes.materials.index),
  });

  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "materialDetail",
  });

  const detailTypeOptions = [
    { label: tDetailType("LIVE"), value: "live" },
    { label: tDetailType("RECORDED"), value: "recorded" },
    { label: tDetailType("RECORDED_LIMIT"), value: "recorded_limit" },
    { label: tDetailType("BOTH"), value: "both" },
    { label: tDetailType("PRESENCE"), value: "presence" },
  ];

  const materialTypeOptions = [
    { label: tMaterialType("SUBJECT"), value: "subject" },
    { label: tMaterialType("COMMUNITY"), value: "community" },
    { label: tMaterialType("QURAN"), value: "quran" },
  ];

  const steps: MultiStepFormStep<MaterialFormValues>[] = [
    {
      id: "title",
      title: tSteps("title.title"),
      description: tSteps("title.description"),
      fields: ["title.en", "title.ar"],
      content: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>
      ),
    },
    {
      id: "description",
      title: tSteps("description.title"),
      description: tSteps("description.description"),
      fields: ["description.en", "description.ar"],
      content: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CustomTextarea
            control={control}
            name="description.en"
            label={t("fields.descriptionEn")}
            placeholder={t("fields.descriptionEnPlaceholder")}
            rows={3}
          />
          <CustomTextarea
            control={control}
            name="description.ar"
            label={t("fields.descriptionAr")}
            placeholder={t("fields.descriptionArPlaceholder")}
            rows={3}
          />
        </div>
      ),
    },
    {
      id: "media",
      title: tSteps("media.title"),
      description: tSteps("media.description"),
      fields: ["cover_id", "demoVideo"],
      content: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CustomInput
            control={control}
            name="cover_id"
            label={t("fields.coverId")}
            placeholder={t("fields.coverIdPlaceholder")}
            description={t("fields.mediaIdDescription")}
          />
          <CustomInput
            control={control}
            name="demoVideo"
            label={t("fields.demoVideo")}
            placeholder={t("fields.demoVideoPlaceholder")}
          />
        </div>
      ),
    },
    {
      id: "materialDetails",
      title: tSteps("materialDetails.title"),
      description: tSteps("materialDetails.description"),
      fields: ["materialDetail"],
      content: (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(initialDetail)}
            >
              <Plus className="me-1 h-4 w-4" />
              {t("actions.addDetail")}
            </Button>
          </div>
          <div className="flex flex-col gap-6">
            {fields.map((field, index) => (
              <MaterialDetailFields
                key={field.id}
                control={control}
                index={index}
                detailTypeOptions={detailTypeOptions}
                materialTypeOptions={materialTypeOptions}
                onRemove={fields.length > 1 ? () => remove(index) : undefined}
              />
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <EntityFormShell<MaterialFormValues>
      mode="steps"
      form={form}
      onSubmit={onSubmit}
      isEdit={isEdit}
      isSubmitting={isSubmitting}
      labels={{
        create: t("submit.create"),
        creating: t("submit.creating"),
        update: t("submit.update"),
        updating: t("submit.updating"),
        cancel: t("cancel"),
        next: tSteps("next"),
        back: tSteps("back"),
        stepIndicator: (current, total, title) =>
          tSteps("indicator", { current, total, title }),
      }}
      steps={steps}
    />
  );
}

interface MaterialDetailFieldsProps {
  control: Control<MaterialFormValues>;
  index: number;
  detailTypeOptions: { label: string; value: string }[];
  materialTypeOptions: { label: string; value: string }[];
  onRemove?: () => void;
}

const MaterialDetailFields = React.memo(function MaterialDetailFields({
  control,
  index,
  detailTypeOptions,
  materialTypeOptions,
  onRemove,
}: MaterialDetailFieldsProps) {
  const t = useTranslations("Materials.form");
  const namePrefix = `materialDetail.${index}` as const;

  return (
    <div className="border-border flex flex-col gap-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {t("detail.heading", { index: index + 1 })}
        </h3>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={t("actions.removeDetail")}
            className="hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CustomSelect
          control={control}
          name={`${namePrefix}.type`}
          label={t("detail.fields.type")}
          placeholder={t("detail.fields.typePlaceholder")}
          options={detailTypeOptions}
          required
        />
        <CustomSelect
          control={control}
          name={`${namePrefix}.material_type`}
          label={t("detail.fields.materialType")}
          placeholder={t("detail.fields.materialTypePlaceholder")}
          options={materialTypeOptions}
          required
        />
        <CustomInfiniteCombobox<ComboboxFetcherEntity, MaterialFormValues>
          control={control}
          name={`${namePrefix}.instructor_id`}
          label={t("detail.fields.instructor")}
          placeholder={t("detail.fields.instructorPlaceholder")}
          queryKey={["instructors-combobox"]}
          queryFn={fetchInstructors}
          getLabel={getEntityLabel}
          getValue={(e) => e.id}
          enableSearch
        />
        <CustomInfiniteCombobox<ComboboxFetcherEntity, MaterialFormValues>
          control={control}
          name={`${namePrefix}.supervisor_id`}
          label={t("detail.fields.supervisor")}
          placeholder={t("detail.fields.supervisorPlaceholder")}
          queryKey={["supervisors-combobox"]}
          queryFn={fetchSupervisors}
          getLabel={getEntityLabel}
          getValue={(e) => e.id}
          enableSearch
        />
        <CustomInfiniteCombobox<ComboboxFetcherEntity, MaterialFormValues>
          control={control}
          name={`${namePrefix}.stage_id`}
          label={t("detail.fields.stage")}
          placeholder={t("detail.fields.stagePlaceholder")}
          queryKey={["stages-combobox"]}
          queryFn={fetchStages}
          getLabel={getEntityLabel}
          getValue={(e) => e.id}
          enableSearch
        />
        <CustomInfiniteCombobox<ComboboxFetcherEntity, MaterialFormValues>
          control={control}
          name={`${namePrefix}.batch_id`}
          label={t("detail.fields.batch")}
          placeholder={t("detail.fields.batchPlaceholder")}
          queryKey={["batches-combobox"]}
          queryFn={fetchBatches}
          getLabel={getEntityLabel}
          getValue={(e) => e.id}
          enableSearch
        />
        <CustomInfiniteCombobox<ComboboxFetcherEntity, MaterialFormValues>
          control={control}
          name={`${namePrefix}.class_id`}
          label={t("detail.fields.class")}
          placeholder={t("detail.fields.classPlaceholder")}
          queryKey={["classes-combobox"]}
          queryFn={fetchClasses}
          getLabel={getEntityLabel}
          getValue={(e) => e.id}
          enableSearch
        />
        <CustomInput
          control={control}
          name={`${namePrefix}.telegram_code`}
          label={t("detail.fields.telegramCode")}
          placeholder={t("detail.fields.telegramCodePlaceholder")}
        />
        <CustomInput
          control={control}
          name={`${namePrefix}.start_date`}
          label={t("detail.fields.startDate")}
          placeholder="YYYY-MM-DD"
        />
        <CustomInput
          control={control}
          name={`${namePrefix}.end_date`}
          label={t("detail.fields.endDate")}
          placeholder="YYYY-MM-DD"
        />
      </div>

      {/* Quiz forms — each gets a unique queryKey so pagination/search state stays isolated */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CustomInfiniteCombobox<ComboboxFetcherEntity, MaterialFormValues>
          control={control}
          name={`${namePrefix}.evaluation_form_id`}
          label={t("detail.fields.evaluationForm")}
          placeholder={t("detail.fields.formPlaceholder")}
          queryKey={["quizzes-combobox", "evaluation"]}
          queryFn={fetchQuizzes}
          getLabel={getEntityLabel}
          getValue={(e) => e.id}
          enableSearch
        />
        <CustomInfiniteCombobox<ComboboxFetcherEntity, MaterialFormValues>
          control={control}
          name={`${namePrefix}.attend_form_id`}
          label={t("detail.fields.attendForm")}
          placeholder={t("detail.fields.formPlaceholder")}
          queryKey={["quizzes-combobox", "attend"]}
          queryFn={fetchQuizzes}
          getLabel={getEntityLabel}
          getValue={(e) => e.id}
          enableSearch
        />
        <CustomInfiniteCombobox<ComboboxFetcherEntity, MaterialFormValues>
          control={control}
          name={`${namePrefix}.quiz_form_id`}
          label={t("detail.fields.quizForm")}
          placeholder={t("detail.fields.formPlaceholder")}
          queryKey={["quizzes-combobox", "quiz"]}
          queryFn={fetchQuizzes}
          getLabel={getEntityLabel}
          getValue={(e) => e.id}
          enableSearch
        />
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CustomNumberInput
          control={control}
          name={`${namePrefix}.count_session`}
          label={t("detail.fields.countSession")}
          min={0}
        />
        <CustomNumberInput
          control={control}
          name={`${namePrefix}.duration_btw_test`}
          label={t("detail.fields.durationBtwTest")}
          min={0}
        />
        <CustomNumberInput
          control={control}
          name={`${namePrefix}.max_attempt`}
          label={t("detail.fields.maxAttempt")}
          min={0}
        />
        <CustomNumberInput
          control={control}
          name={`${namePrefix}.close_quiz_after_hours`}
          label={t("detail.fields.closeQuizAfterHours")}
          min={0}
        />
        <CustomNumberInput
          control={control}
          name={`${namePrefix}.close_eval_after_hours`}
          label={t("detail.fields.closeEvalAfterHours")}
          min={0}
        />
        <CustomNumberInput
          control={control}
          name={`${namePrefix}.close_attend_after_hours`}
          label={t("detail.fields.closeAttendAfterHours")}
          min={0}
        />
        <CustomNumberInput
          control={control}
          name={`${namePrefix}.send_live_link_before_hours`}
          label={t("detail.fields.sendLiveLinkBeforeHours")}
          min={0}
        />
      </div>

      {/* Boolean flags */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CustomSwitch
          control={control}
          name={`${namePrefix}.show_total_result`}
          label={t("detail.fields.showTotalResult")}
        />
        <CustomSwitch
          control={control}
          name={`${namePrefix}.show_result_attendance`}
          label={t("detail.fields.showResultAttendance")}
        />
        <CustomSwitch
          control={control}
          name={`${namePrefix}.show_evaluation`}
          label={t("detail.fields.showEvaluation")}
        />
        <CustomSwitch
          control={control}
          name={`${namePrefix}.show_quiz`}
          label={t("detail.fields.showQuiz")}
        />
        <CustomSwitch
          control={control}
          name={`${namePrefix}.allow_result_to_instructor`}
          label={t("detail.fields.allowResultToInstructor")}
        />
        <CustomSwitch
          control={control}
          name={`${namePrefix}.allow_result_to_supervisor`}
          label={t("detail.fields.allowResultToSupervisor")}
        />
        <CustomSwitch
          control={control}
          name={`${namePrefix}.isActive`}
          label={t("detail.fields.isActive")}
        />
      </div>
    </div>
  );
});

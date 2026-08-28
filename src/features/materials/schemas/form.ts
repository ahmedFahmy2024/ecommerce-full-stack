import { z } from "zod";

type Translator = (key: string) => string;

const materialDetailTypeEnum = z.enum([
  "live",
  "recorded",
  "recorded_limit",
  "both",
  "presence",
]);

const materialTypeEnum = z.enum(["subject", "community", "quran"]);

export const materialDetailFormSchema = z.object({
  type: materialDetailTypeEnum,
  material_type: materialTypeEnum,
  instructor_id: z.string().nullish(),
  supervisor_id: z.string().nullish(),
  stage_id: z.string().nullish(),
  batch_id: z.string().nullish(),
  class_id: z.string().nullish(),
  telegram_code: z.string().nullish(),
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
  evaluation_form_id: z.string().nullish(),
  attend_form_id: z.string().nullish(),
  quiz_form_id: z.string().nullish(),
  count_session: z.number().int().nullish(),
  duration_btw_test: z.number().int().nullish(),
  max_attempt: z.number().int().nullish(),
  close_quiz_after_hours: z.number().nullish(),
  close_eval_after_hours: z.number().nullish(),
  close_attend_after_hours: z.number().nullish(),
  send_live_link_before_hours: z.number().nullish(),
  show_total_result: z.boolean().optional(),
  show_result_attendance: z.boolean().optional(),
  show_evaluation: z.boolean().optional(),
  show_quiz: z.boolean().optional(),
  allow_result_to_instructor: z.boolean().optional(),
  allow_result_to_supervisor: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type MaterialDetailFormValues = z.infer<typeof materialDetailFormSchema>;

export function makeMaterialFormSchema(t: Translator) {
  return z.object({
    title: z.object({
      en: z.string().min(1, { message: t("errors.titleEnRequired") }),
      ar: z.string().min(1, { message: t("errors.titleArRequired") }),
    }),
    description: z
      .object({
        en: z.string().optional(),
        ar: z.string().optional(),
      })
      .optional(),
    cover_id: z.string().nullish(),
    demoVideo: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    materialDetail: z
      .array(materialDetailFormSchema)
      .min(1, { message: t("errors.materialDetailRequired") }),
  });
}

export type MaterialFormSchema = ReturnType<typeof makeMaterialFormSchema>;
export type MaterialFormValues = z.infer<MaterialFormSchema>;

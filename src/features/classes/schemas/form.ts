import { z } from "zod";

type Translator = (key: string) => string;

export function makeClassFormSchema(t: Translator) {
  return z.object({
    name: z.object({
      en: z.string().min(1, { message: t("errors.nameEnRequired") }),
      ar: z.string().min(1, { message: t("errors.nameArRequired") }),
    }),
    notes: z
      .object({
        en: z.string().optional(),
        ar: z.string().optional(),
      })
      .optional(),
    gender: z.enum(["male", "female", "both"], {
      message: t("errors.genderRequired"),
    }),
    status: z.enum(["active", "not_active", "deleted", "pending", "finished"], {
      message: t("errors.statusRequired"),
    }),
    telegram_code: z.string().optional(),
    category_id: z.string().min(1, { message: t("errors.categoryRequired") }),
    stage_id: z.string().min(1, { message: t("errors.stageRequired") }),
    batch_id: z.string().min(1, { message: t("errors.batchRequired") }),
    limit_sound: z.number().nullish(),
  });
}

export type ClassFormSchema = ReturnType<typeof makeClassFormSchema>;
export type ClassFormInput = z.input<ClassFormSchema>;
export type ClassFormValues = z.infer<ClassFormSchema>;

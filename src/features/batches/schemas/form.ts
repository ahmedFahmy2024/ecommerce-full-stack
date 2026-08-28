import { z } from "zod";

type Translator = (key: string) => string;

export function makeBatchFormSchema(t: Translator) {
  return z.object({
    title: z.object({
      en: z.string().min(1, { message: t("errors.titleEnRequired") }),
      ar: z.string().min(1, { message: t("errors.titleArRequired") }),
    }),
    status: z.enum(["active", "inactive", "deleted", "pending", "finished"], {
      message: t("errors.statusRequired"),
    }),
    notes: z
      .object({
        en: z.string().optional(),
        ar: z.string().optional(),
      })
      .optional(),
    category_id: z.string().min(1, { message: t("errors.categoryRequired") }),
    stage_id: z.string().min(1, { message: t("errors.stageRequired") }),
  });
}

export type BatchFormSchema = ReturnType<typeof makeBatchFormSchema>;
export type BatchFormValues = z.infer<BatchFormSchema>;

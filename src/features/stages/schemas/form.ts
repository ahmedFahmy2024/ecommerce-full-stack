import { z } from "zod";

type Translator = (key: string) => string;

export function makeStageFormSchema(t: Translator) {
  return z.object({
    title: z.object({
      en: z.string().min(1, { message: t("errors.titleEnRequired") }),
      ar: z.string().min(1, { message: t("errors.titleArRequired") }),
    }),
    status: z.enum(["active", "not_active"], {
      message: t("errors.statusRequired"),
    }),
    category_id: z.string().min(1, { message: t("errors.categoryRequired") }),
  });
}

export type StageFormSchema = ReturnType<typeof makeStageFormSchema>;
export type StageFormValues = z.infer<StageFormSchema>;

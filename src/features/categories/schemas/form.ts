import { z } from "zod";

type Translator = (key: string) => string;

export function makeCategoryFormSchema(t: Translator) {
  return z.object({
    title: z.object({
      en: z.string().min(1, { message: t("errors.titleEnRequired") }),
      ar: z.string().min(1, { message: t("errors.titleArRequired") }),
    }),
    status: z.enum(["active", "inactive"], {
      message: t("errors.statusRequired"),
    }),
  });
}

export type CategoryFormSchema = ReturnType<typeof makeCategoryFormSchema>;
export type CategoryFormValues = z.infer<CategoryFormSchema>;

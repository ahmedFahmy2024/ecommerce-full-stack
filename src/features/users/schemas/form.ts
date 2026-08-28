import { z } from "zod";

type Translator = (key: string) => string;

export function makeUserFormSchema(t: Translator) {
  return z.object({
    fullName: z.string().min(1, { message: t("errors.fullNameRequired") }),
    email: z
      .union([z.email({ message: t("errors.emailInvalid") }), z.literal("")])
      .optional(),
    phone: z.string().optional(),
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 8, {
        message: t("errors.passwordTooShort"),
      }),
    gender: z.enum(["male", "female"], {
      message: t("errors.genderRequired"),
    }),
    birthDate: z.date({ message: t("errors.birthDateRequired") }),
    status: z.enum(["active", "inactive", "not_active", "deleted", "pending"], {
      message: t("errors.statusRequired"),
    }),
    countryId: z.string().min(1, { message: t("errors.countryRequired") }),
    roles: z.array(z.string()),
    graduationYear: z.string().optional(),
    telegramCode: z.string().optional(),
    fingerprint: z.string().optional(),
    fingerprintStatus: z.boolean().optional(),
    background_application: z.boolean().optional(),
    add_to_home_screen: z.boolean().optional(),
    notes: z
      .object({
        en: z.string().optional(),
        ar: z.string().optional(),
      })
      .optional(),
  });
}

export type UserFormSchema = ReturnType<typeof makeUserFormSchema>;
export type UserFormValues = z.infer<UserFormSchema>;

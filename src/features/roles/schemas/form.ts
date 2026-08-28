import { z } from "zod";

type Translator = (key: string) => string;

export function makeRoleFormSchema(t: Translator) {
  return z.object({
    name: z.object({
      en: z.string().min(1, { message: t("errors.nameEnRequired") }),
      ar: z.string().min(1, { message: t("errors.nameArRequired") }),
    }),
    guardName: z.enum(["admin", "user"], {
      message: t("errors.guardNameRequired"),
    }),
    permissionIds: z
      .array(z.string())
      .min(1, { message: t("errors.permissionsRequired") }),
  });
}

export type RoleFormSchema = ReturnType<typeof makeRoleFormSchema>;
export type RoleFormValues = z.infer<RoleFormSchema>;

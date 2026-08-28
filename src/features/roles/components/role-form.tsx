"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  CustomInput,
  CustomSelect,
  FormFooter,
  FormSection,
  useEntityFormSubmit,
} from "@/components/form";
import { routes } from "@/constants/routes";
import { useRouter } from "@/i18n/navigation";
import { ROLES_CREATE, ROLES_UPDATE } from "@/services/api/queries";
import { type RoleFormValues, makeRoleFormSchema } from "../schemas/form";
import type { Role } from "../types";
import { PermissionsSelector } from "./permissions-selector";

interface RoleFormProps {
  role?: Role;
}

function getRoleNames(name: Role["name"] | undefined) {
  if (!name) return { en: "", ar: "" };
  if (typeof name === "string") return { en: name, ar: "" };
  return { en: name.en ?? "", ar: name.ar ?? "" };
}

export function RoleForm({ role }: RoleFormProps) {
  "use no memo";

  const t = useTranslations("Roles.form");
  const tGuard = useTranslations("Roles.guardName");
  const router = useRouter();
  const isEdit = !!role;

  const schema = React.useMemo(
    () => makeRoleFormSchema(t as (k: string) => string),
    [t],
  );

  const initialNames = getRoleNames(role?.name);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialNames,
      guardName: (role?.guardName as RoleFormValues["guardName"]) ?? "admin",
      permissionIds: role?.permissions?.map((p) => p.id) ?? [],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit = useEntityFormSubmit<RoleFormValues, Role>({
    entity: role,
    createEndpoint: ROLES_CREATE,
    updateEndpoint: ROLES_UPDATE,
    getId: (r) => r.id,
    onSuccess: () => router.push(routes.roles.index),
  });

  const guardOptions = [
    { label: tGuard("admin"), value: "admin" },
    { label: tGuard("user"), value: "user" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormSection title={t("sections.basicInfo")}>
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
        <CustomSelect
          control={control}
          name="guardName"
          label={t("fields.guardName")}
          placeholder={t("fields.guardNamePlaceholder")}
          options={guardOptions}
          required
        />
      </FormSection>

      <FormSection title={t("sections.permissions")} columns={1}>
        <PermissionsSelector<RoleFormValues>
          control={control}
          name="permissionIds"
          label={t("fields.permissions")}
          description={t("fields.permissionsDescription")}
          required
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
        onCancel={() => router.push(routes.roles.index)}
      />
    </form>
  );
}

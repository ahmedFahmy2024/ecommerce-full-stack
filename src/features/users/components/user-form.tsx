"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import {
  CustomDatePicker,
  CustomInfiniteCombobox,
  CustomInfiniteMultiCombobox,
  CustomInput,
  CustomPhoneInput,
  CustomSelect,
  CustomSwitch,
  CustomTextarea,
  EntityFormShell,
  useEntityForm,
} from "@/components/form";
import { routes } from "@/constants/routes";
import { useRouter } from "@/i18n/navigation";
import {
  type ComboboxFetcherEntity,
  makeComboboxFetcher,
} from "@/lib/combobox-fetcher";
import {
  COUNTRIES,
  ROLES,
  USERS_CREATE,
  USERS_UPDATE,
} from "@/services/api/queries";
import { type UserFormValues, makeUserFormSchema } from "../schemas/form";
import type { User } from "../types";

const fetchCountries = makeComboboxFetcher<ComboboxFetcherEntity>(COUNTRIES);
const fetchRoles = makeComboboxFetcher<ComboboxFetcherEntity>(ROLES);

interface UserFormProps {
  user?: User;
}

type UserFormBody = Omit<
  UserFormValues,
  "birthDate" | "email" | "password" | "notes"
> & {
  birthDate: string | undefined;
  email: string | null;
  password: string | null;
  notes: UserFormValues["notes"] | null;
};

export function UserForm({ user }: UserFormProps) {
  "use no memo";

  const t = useTranslations("Users.form");
  const tStatus = useTranslations("Users.status");
  const tGender = useTranslations("Users.gender");
  const router = useRouter();

  const schema = React.useMemo(
    () => makeUserFormSchema(t as (k: string) => string),
    [t],
  );

  const { form, onSubmit, isEdit, isSubmitting } = useEntityForm<
    UserFormValues,
    User,
    UserFormBody
  >({
    entity: user,
    schema,
    defaultValues: (u) => ({
      fullName: u?.fullName ?? "",
      email: u?.email ?? "",
      phone: u?.phone ?? "",
      password: "",
      gender: u?.gender,
      birthDate: u?.birthDate ? new Date(u.birthDate) : undefined,
      status: (u?.status as UserFormValues["status"]) ?? undefined,
      countryId: u?.countryId ?? "",
      roles: u?.roles?.map((r) => r.id) ?? [],
      graduationYear: u?.graduationYear ?? "",
      telegramCode: u?.telegramCode ?? "",
      fingerprint: u?.fingerprint ?? "",
      fingerprintStatus: u?.fingerprintStatus ?? true,
      background_application: u?.background_application ?? false,
      add_to_home_screen: u?.add_to_home_screen ?? false,
      notes: { en: "", ar: "" },
    }),
    createEndpoint: USERS_CREATE,
    updateEndpoint: USERS_UPDATE,
    getId: (u) => u.id,
    transform: (values) => ({
      ...values,
      birthDate: values.birthDate
        ? `${values.birthDate.getFullYear()}-${String(
            values.birthDate.getMonth() + 1,
          ).padStart(
            2,
            "0",
          )}-${String(values.birthDate.getDate()).padStart(2, "0")}`
        : undefined,
      notes: values.notes?.en || values.notes?.ar ? values.notes : null,
      email: values.email || null,
      password: values.password || null,
    }),
    onSuccess: () => router.push(routes.users.index),
  });

  const { control } = form;

  const genderOptions = [
    { label: tGender("male"), value: "male" },
    { label: tGender("female"), value: "female" },
  ];

  const statusOptions = [
    { label: tStatus("active"), value: "active" },
    { label: tStatus("inactive"), value: "inactive" },
    { label: "Not Active", value: "not_active" },
    { label: "Pending", value: "pending" },
    { label: "Deleted", value: "deleted" },
  ];

  return (
    <EntityFormShell<UserFormValues>
      mode="single"
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
      }}
      onCancel={() => router.push(routes.users.index)}
      sections={[
        {
          title: t("sections.basicInfo"),
          children: (
            <>
              <CustomInput
                control={control}
                name="fullName"
                label={t("fields.fullName")}
                placeholder={t("fields.fullNamePlaceholder")}
                required
              />
              <CustomInput
                control={control}
                name="email"
                label={t("fields.email")}
                type="email"
                placeholder={t("fields.emailPlaceholder")}
              />
              <CustomPhoneInput
                control={control}
                name="phone"
                label={t("fields.phone")}
                placeholder={t("fields.phonePlaceholder")}
              />
              <CustomSelect
                control={control}
                name="gender"
                label={t("fields.gender")}
                placeholder={t("fields.genderPlaceholder")}
                options={genderOptions}
                required
              />
              <CustomDatePicker
                control={control}
                name="birthDate"
                label={t("fields.birthDate")}
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
              <CustomInfiniteCombobox<ComboboxFetcherEntity, UserFormValues>
                control={control}
                name="countryId"
                label={t("fields.country")}
                placeholder={t("fields.countryPlaceholder")}
                queryKey={["countries-combobox"]}
                queryFn={fetchCountries}
                getLabel={(c) =>
                  typeof c.name === "string" ? c.name : (c.name?.en ?? c.id)
                }
                getValue={(c) => c.id}
                initialLabel={user?.countryName ?? undefined}
                enableSearch
                required
              />
              <CustomInfiniteMultiCombobox<ComboboxFetcherEntity, UserFormValues>
                control={control}
                name="roles"
                label={t("fields.roles")}
                placeholder={t("fields.rolesPlaceholder")}
                queryKey={["roles-combobox"]}
                queryFn={fetchRoles}
                getLabel={(r) =>
                  typeof r.name === "string" ? r.name : (r.name?.en ?? r.id)
                }
                getValue={(r) => r.id}
                enableSearch
              />
            </>
          ),
        },
        {
          title: t("sections.account"),
          children: (
            <>
              <CustomInput
                control={control}
                name="password"
                label={t("fields.password")}
                type="password"
                placeholder={t("fields.passwordPlaceholder")}
                description={
                  isEdit ? t("fields.passwordDescription") : undefined
                }
              />
              <CustomInput
                control={control}
                name="graduationYear"
                label={t("fields.graduationYear")}
                placeholder={t("fields.graduationYearPlaceholder")}
              />
              <CustomInput
                control={control}
                name="telegramCode"
                label={t("fields.telegramCode")}
                placeholder={t("fields.telegramCodePlaceholder")}
              />
              <CustomInput
                control={control}
                name="fingerprint"
                label={t("fields.fingerprint")}
                placeholder={t("fields.fingerprintPlaceholder")}
              />
            </>
          ),
        },
        {
          title: t("sections.settings"),
          children: (
            <>
              <CustomSwitch
                control={control}
                name="fingerprintStatus"
                label={t("fields.fingerprintStatus")}
              />
              <CustomSwitch
                control={control}
                name="background_application"
                label={t("fields.backgroundApp")}
              />
              <CustomSwitch
                control={control}
                name="add_to_home_screen"
                label={t("fields.addToHomeScreen")}
              />
            </>
          ),
        },
        {
          title: t("fields.notes"),
          children: (
            <>
              <CustomTextarea
                control={control}
                name="notes.en"
                label={t("fields.notes")}
                placeholder={t("fields.notesEnPlaceholder")}
                rows={3}
              />
              <CustomTextarea
                control={control}
                name="notes.ar"
                label={t("fields.notes")}
                placeholder={t("fields.notesArPlaceholder")}
                rows={3}
              />
            </>
          ),
        },
      ]}
    />
  );
}

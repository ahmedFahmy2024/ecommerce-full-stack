"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import {
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import type { ZodType } from "zod";

interface UseEntityFormOptions<TValues extends FieldValues> {
  schema: ZodType<TValues, TValues>;
  defaultValues: DefaultValues<TValues>;
  formOptions?: Omit<UseFormProps<TValues>, "resolver" | "defaultValues">;
}

interface UseEntityFormResult<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  isSubmitting: boolean;
}

/**
 * Generic form helper (UI primitive, no API).
 *
 * Previous version wired `createEndpoint`/`updateEndpoint` via `apiClient`
 * string registry. That registry was deleted in T16 remediation — old
 * education endpoints do not exist on Nest. Feature code now calls
 * `request` from `services/api` directly with typed `path` + `ApiRequestOptions`.
 */
export function useEntityForm<TValues extends FieldValues>({
  schema,
  defaultValues,
  formOptions,
}: UseEntityFormOptions<TValues>): UseEntityFormResult<TValues> {
  const initialDefaultsRef = React.useRef<DefaultValues<TValues> | null>(null);
  if (initialDefaultsRef.current === null) {
    initialDefaultsRef.current = defaultValues;
  }

  const form = useForm<TValues>({
    ...formOptions,
    resolver: zodResolver(schema) as Resolver<TValues>,
    defaultValues: initialDefaultsRef.current,
  });

  return {
    form,
    isSubmitting: form.formState.isSubmitting,
  };
}

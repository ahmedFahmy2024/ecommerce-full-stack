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

import { useEntityFormSubmit } from "./use-entity-form-submit";

interface UseEntityFormOptions<TValues extends FieldValues, TEntity, TBody> {
  entity?: TEntity;
  // Zod 4 schemas use distinct Input/Output types; we constrain both ends to
  // TValues so the form values, parsed output, and field paths all line up.
  schema: ZodType<TValues, TValues>;
  defaultValues: (entity: TEntity | undefined) => DefaultValues<TValues>;
  createEndpoint: string;
  updateEndpoint: string;
  getId: (entity: TEntity) => string;
  transform?: (values: TValues) => TBody;
  onSuccess?: () => void;
  formOptions?: Omit<
    UseFormProps<TValues>,
    "resolver" | "defaultValues"
  >;
}

interface UseEntityFormResult<TValues extends FieldValues, TEntity> {
  form: UseFormReturn<TValues>;
  onSubmit: (values: TValues) => Promise<void>;
  isEdit: boolean;
  isSubmitting: boolean;
  entity: TEntity | undefined;
}

/**
 * Wires react-hook-form, zod validation, and the create/update submit pipeline
 * into a single hook so feature forms don't re-assemble these pieces.
 */
export function useEntityForm<
  TValues extends FieldValues,
  TEntity,
  TBody = TValues,
>({
  entity,
  schema,
  defaultValues,
  createEndpoint,
  updateEndpoint,
  getId,
  transform,
  onSuccess,
  formOptions,
}: UseEntityFormOptions<TValues, TEntity, TBody>): UseEntityFormResult<
  TValues,
  TEntity
> {
  // Compute defaults once for the lifetime of this entity reference. RHF reads
  // defaultValues only on mount; recomputing each render is wasted work.
  const initialDefaultsRef = React.useRef<DefaultValues<TValues> | null>(null);
  if (initialDefaultsRef.current === null) {
    initialDefaultsRef.current = defaultValues(entity);
  }

  const form = useForm<TValues>({
    ...formOptions,
    resolver: zodResolver(schema) as Resolver<TValues>,
    defaultValues: initialDefaultsRef.current,
  });

  const onSubmit = useEntityFormSubmit<TValues, TEntity, TBody>({
    entity,
    createEndpoint,
    updateEndpoint,
    getId,
    transform,
    onSuccess,
  });

  return {
    form,
    onSubmit,
    isEdit: !!entity,
    isSubmitting: form.formState.isSubmitting,
    entity,
  };
}

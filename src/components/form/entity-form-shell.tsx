"use client";

import * as React from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { cn } from "@/lib/utils";

import { FormFooter } from "./form-footer";
import { FormSection } from "./form-section";
import {
  MultiStepFormShell,
  type MultiStepFormStep,
} from "./multi-step-form-shell";

export interface EntityFormSection {
  title: string;
  description?: string;
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
}

export interface EntityFormLabels {
  create: string;
  creating: string;
  update: string;
  updating: string;
  cancel: string;
  /** Multi-step only. */
  next?: string;
  /** Multi-step only. */
  back?: string;
  /** Multi-step only. */
  stepIndicator?: (current: number, total: number, title: string) => string;
}

interface CommonProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  onSubmit: (values: TFormValues) => void | Promise<void>;
  isEdit: boolean;
  isSubmitting: boolean;
  labels: EntityFormLabels;
  className?: string;
}

interface SingleStepProps<TFormValues extends FieldValues>
  extends CommonProps<TFormValues> {
  mode: "single";
  sections: EntityFormSection[];
  onCancel?: () => void;
  footerAlign?: "start" | "end";
}

interface MultiStepProps<TFormValues extends FieldValues>
  extends CommonProps<TFormValues> {
  mode: "steps";
  steps: MultiStepFormStep<TFormValues>[];
}

export type EntityFormShellProps<TFormValues extends FieldValues> =
  | SingleStepProps<TFormValues>
  | MultiStepProps<TFormValues>;

export function EntityFormShell<TFormValues extends FieldValues>(
  props: EntityFormShellProps<TFormValues>,
) {
  "use no memo";

  if (props.mode === "steps") {
    const { form, steps, onSubmit, isEdit, isSubmitting, labels, className } =
      props;
    return (
      <MultiStepFormShell<TFormValues>
        form={form}
        steps={steps}
        onSubmit={onSubmit}
        submitLabel={isEdit ? labels.update : labels.create}
        submittingLabel={isEdit ? labels.updating : labels.creating}
        nextLabel={labels.next ?? "Next"}
        backLabel={labels.back ?? "Back"}
        stepIndicatorLabel={labels.stepIndicator}
        className={className}
      />
    );
  }

  const {
    form,
    sections,
    onSubmit,
    onCancel,
    isEdit,
    isSubmitting,
    labels,
    footerAlign,
    className,
  } = props;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
    >
      {sections.map((section) => (
        <FormSection
          key={section.title}
          title={section.title}
          description={section.description}
          columns={section.columns}
        >
          {section.children}
        </FormSection>
      ))}

      <FormFooter
        isSubmitting={isSubmitting}
        isEdit={isEdit}
        labels={{
          create: labels.create,
          creating: labels.creating,
          update: labels.update,
          updating: labels.updating,
          cancel: labels.cancel,
        }}
        onCancel={onCancel}
        align={footerAlign}
      />
    </form>
  );
}

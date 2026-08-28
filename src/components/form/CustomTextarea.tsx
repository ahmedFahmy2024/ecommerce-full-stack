"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonTextareaProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
}

type RHFTextareaProps<T extends FieldValues> = CommonTextareaProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledTextareaProps = CommonTextareaProps & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomTextareaProps<T extends FieldValues> =
  | RHFTextareaProps<T>
  | ControlledTextareaProps;

interface TextareaCoreProps extends CommonTextareaProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  textareaId?: string;
}

function TextareaCore({
  label,
  placeholder,
  disabled,
  className,
  description,
  required,
  rows,
  maxLength,
  showCount = false,
  value,
  onChange,
  error,
  textareaId,
}: TextareaCoreProps) {
  const id = textareaId ?? label?.toLowerCase().replace(/\s+/g, "-");
  const count = value.length;

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={id}
      className={className}
    >
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
      />
      {showCount && (
        <p className="text-right text-xs tabular-nums text-muted-foreground">
          {count}
          {maxLength ? `/${maxLength}` : ""} characters
        </p>
      )}
    </FormFieldWrapper>
  );
}

function RHFTextarea<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFTextareaProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <TextareaCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
      textareaId={String(name)}
    />
  );
}

export function CustomTextarea<T extends FieldValues>(
  props: CustomTextareaProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFTextarea {...(props as RHFTextareaProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledTextareaProps;
  return <TextareaCore {...rest} value={value} onChange={onChange} />;
}

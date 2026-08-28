"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

export interface CheckboxGroupOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface CommonCheckboxGroupProps {
  options: CheckboxGroupOption[];
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  /** Layout direction. Default "vertical". */
  orientation?: "horizontal" | "vertical";
}

type RHFCheckboxGroupProps<T extends FieldValues> = CommonCheckboxGroupProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledCheckboxGroupProps = CommonCheckboxGroupProps & {
  control?: never;
  name?: never;
  value: string[];
  onChange: (val: string[]) => void;
};

export type CustomCheckboxGroupProps<T extends FieldValues> =
  | RHFCheckboxGroupProps<T>
  | ControlledCheckboxGroupProps;

interface CheckboxGroupCoreProps extends CommonCheckboxGroupProps {
  value: string[];
  onChange: (val: string[]) => void;
  error?: string;
  groupName?: string;
}

function CheckboxGroupCore({
  options,
  label,
  description,
  disabled,
  className,
  required,
  orientation = "vertical",
  value,
  onChange,
  error,
  groupName = "checkbox-group",
}: CheckboxGroupCoreProps) {
  const toggle = (optValue: string) => {
    onChange(
      value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue],
    );
  };

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div
        role="group"
        aria-invalid={error ? true : undefined}
        className={cn(
          "flex gap-3",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        )}
      >
        {options.map((opt) => {
          const id = `${groupName}-${opt.value}`;
          const isDisabled = disabled || opt.disabled;
          return (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={value.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
                disabled={isDisabled}
                aria-invalid={error ? true : undefined}
              />
              <Label
                htmlFor={id}
                className={cn(isDisabled && "cursor-not-allowed opacity-50")}
              >
                {opt.label}
              </Label>
            </div>
          );
        })}
      </div>
    </FormFieldWrapper>
  );
}

function RHFCheckboxGroup<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFCheckboxGroupProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <CheckboxGroupCore
      {...props}
      value={Array.isArray(field.value) ? field.value : []}
      onChange={field.onChange}
      error={fieldState.error?.message}
      groupName={String(name)}
    />
  );
}

export function CustomCheckboxGroup<T extends FieldValues>(
  props: CustomCheckboxGroupProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFCheckboxGroup {...(props as RHFCheckboxGroupProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledCheckboxGroupProps;
  return <CheckboxGroupCore {...rest} value={value} onChange={onChange} />;
}

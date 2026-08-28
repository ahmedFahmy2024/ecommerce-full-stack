"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormFieldWrapper } from "./FormFieldWrapper";

export interface RadioOption {
  label: string;
  value: string;
}

interface CommonRadioGroupProps {
  options: RadioOption[];
  label?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
}

type RHFRadioGroupProps<T extends FieldValues> = CommonRadioGroupProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledRadioGroupProps = CommonRadioGroupProps & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomRadioGroupProps<T extends FieldValues> =
  | RHFRadioGroupProps<T>
  | ControlledRadioGroupProps;

interface RadioGroupCoreProps extends CommonRadioGroupProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  groupName?: string;
}

function RadioGroupCore({
  options,
  label,
  disabled,
  className,
  description,
  required,
  value,
  onChange,
  error,
  groupName = "radio",
}: RadioGroupCoreProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
      >
        {options.map((opt) => {
          const itemId = `${groupName}-${opt.value}`;
          return (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={itemId} />
              <Label htmlFor={itemId}>{opt.label}</Label>
            </div>
          );
        })}
      </RadioGroup>
    </FormFieldWrapper>
  );
}

function RHFRadioGroup<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFRadioGroupProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <RadioGroupCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
      groupName={String(name)}
    />
  );
}

export function CustomRadioGroup<T extends FieldValues>(
  props: CustomRadioGroupProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFRadioGroup {...(props as RHFRadioGroupProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledRadioGroupProps;
  return <RadioGroupCore {...rest} value={value} onChange={onChange} />;
}

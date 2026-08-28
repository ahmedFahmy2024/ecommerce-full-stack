"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonCheckboxProps {
  label?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
}

type RHFCheckboxProps<T extends FieldValues> = CommonCheckboxProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledCheckboxProps = CommonCheckboxProps & {
  control?: never;
  name?: never;
  value: boolean;
  onChange: (val: boolean) => void;
};

export type CustomCheckboxProps<T extends FieldValues> =
  | RHFCheckboxProps<T>
  | ControlledCheckboxProps;

interface CheckboxCoreProps extends CommonCheckboxProps {
  value: boolean;
  onChange: (val: boolean) => void;
  error?: string;
  checkboxId?: string;
}

function CheckboxCore({
  label,
  disabled,
  className,
  description,
  required,
  value,
  onChange,
  error,
  checkboxId,
}: CheckboxCoreProps) {
  const id =
    checkboxId ?? label?.toLowerCase().replace(/\s+/g, "-") ?? "checkbox";
  return (
    <FormFieldWrapper
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={value}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
        />
        {label && <Label htmlFor={id}>{label}</Label>}
      </div>
    </FormFieldWrapper>
  );
}

function RHFCheckbox<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFCheckboxProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <CheckboxCore
      {...props}
      value={field.value === true}
      onChange={(checked) => field.onChange(checked)}
      error={fieldState.error?.message}
      checkboxId={String(name)}
    />
  );
}

export function CustomCheckbox<T extends FieldValues>(
  props: CustomCheckboxProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFCheckbox {...(props as RHFCheckboxProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledCheckboxProps;
  return <CheckboxCore {...rest} value={value} onChange={onChange} />;
}

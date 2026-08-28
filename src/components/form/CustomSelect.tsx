"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldWrapper } from "./FormFieldWrapper";

export interface SelectOption {
  label: string;
  value: string;
}

interface CommonSelectProps {
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
}

type RHFSelectProps<T extends FieldValues> = CommonSelectProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledSelectProps = CommonSelectProps & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomSelectProps<T extends FieldValues> =
  | RHFSelectProps<T>
  | ControlledSelectProps;

interface SelectCoreProps extends CommonSelectProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  selectId?: string;
}

function SelectCore({
  options,
  label,
  placeholder,
  disabled,
  className,
  description,
  required,
  value,
  onChange,
  error,
  selectId,
}: SelectCoreProps) {
  const id = selectId ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={id}
      className={className}
    >
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={error ? true : undefined}
        >
          <SelectValue placeholder={placeholder ?? "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
}

function RHFSelect<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFSelectProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <SelectCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
      selectId={String(name)}
    />
  );
}

export function CustomSelect<T extends FieldValues>(
  props: CustomSelectProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFSelect {...(props as RHFSelectProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledSelectProps;
  return <SelectCore {...rest} value={value} onChange={onChange} />;
}

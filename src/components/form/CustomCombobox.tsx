"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { FormFieldWrapper } from "./FormFieldWrapper";

export interface ComboboxOption {
  label: string;
  value: string;
}

interface CommonComboboxProps {
  options: ComboboxOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
}

type RHFComboboxProps<T extends FieldValues> = CommonComboboxProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledComboboxProps = CommonComboboxProps & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomComboboxProps<T extends FieldValues> =
  | RHFComboboxProps<T>
  | ControlledComboboxProps;

interface ComboboxCoreProps extends CommonComboboxProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

function ComboboxCore({
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
}: ComboboxCoreProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Combobox
        value={value}
        onValueChange={(val) => onChange(val ?? "")}
        disabled={disabled}
      >
        <ComboboxInput
          placeholder={placeholder ?? "Search..."}
          showTrigger
          showClear
          disabled={disabled}
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxList>
            {options.map((opt) => (
              <ComboboxItem key={opt.value} value={opt.value}>
                {opt.label}
              </ComboboxItem>
            ))}
            <ComboboxEmpty>No results found.</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FormFieldWrapper>
  );
}

function RHFCombobox<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFComboboxProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <ComboboxCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function CustomCombobox<T extends FieldValues>(
  props: CustomComboboxProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFCombobox {...(props as RHFComboboxProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledComboboxProps;
  return <ComboboxCore {...rest} value={value} onChange={onChange} />;
}

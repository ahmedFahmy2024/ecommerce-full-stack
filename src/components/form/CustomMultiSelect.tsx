"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { FormFieldWrapper } from "./FormFieldWrapper";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface CommonMultiSelectProps {
  options: MultiSelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
}

type RHFMultiSelectProps<T extends FieldValues> = CommonMultiSelectProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledMultiSelectProps = CommonMultiSelectProps & {
  control?: never;
  name?: never;
  value: string[];
  onChange: (val: string[]) => void;
};

export type CustomMultiSelectProps<T extends FieldValues> =
  | RHFMultiSelectProps<T>
  | ControlledMultiSelectProps;

interface MultiSelectCoreProps extends CommonMultiSelectProps {
  value: string[];
  onChange: (val: string[]) => void;
  error?: string;
}

function MultiSelectCore({
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
}: MultiSelectCoreProps) {
  const anchor = useComboboxAnchor();

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Combobox
        multiple
        value={value}
        onValueChange={(val) => onChange(val ?? [])}
        disabled={disabled}
      >
        <ComboboxChips ref={anchor} aria-invalid={error ? true : undefined}>
          {value.map((v) => {
            const opt = options.find((o) => o.value === v);
            return <ComboboxChip key={v}>{opt?.label ?? v}</ComboboxChip>;
          })}
          <ComboboxChipsInput
            placeholder={value.length === 0 ? placeholder : undefined}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
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

function RHFMultiSelect<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFMultiSelectProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <MultiSelectCore
      {...props}
      value={field.value ?? []}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function CustomMultiSelect<T extends FieldValues>(
  props: CustomMultiSelectProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFMultiSelect {...(props as RHFMultiSelectProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledMultiSelectProps;
  return <MultiSelectCore {...rest} value={value} onChange={onChange} />;
}

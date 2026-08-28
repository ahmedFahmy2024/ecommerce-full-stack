"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Slider } from "@/components/ui/slider";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonSliderProps {
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  formatValue?: (val: number) => string;
}

type RHFSliderProps<T extends FieldValues> = CommonSliderProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledSliderProps = CommonSliderProps & {
  control?: never;
  name?: never;
  value: number;
  onChange: (val: number) => void;
};

export type CustomSliderProps<T extends FieldValues> =
  | RHFSliderProps<T>
  | ControlledSliderProps;

interface SliderCoreProps extends CommonSliderProps {
  value: number;
  onChange: (val: number) => void;
  error?: string;
}

function SliderCore({
  label,
  description,
  disabled,
  className,
  required,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  formatValue,
  value,
  onChange,
  error,
}: SliderCoreProps) {
  const display = formatValue ? formatValue(value) : String(value);

  return (
    <FormFieldWrapper
      label={
        label
          ? showValue
            ? `${label} — ${display}`
            : label
          : showValue
            ? display
            : undefined
      }
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </FormFieldWrapper>
  );
}

function RHFSlider<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFSliderProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <SliderCore
      {...props}
      value={field.value ?? props.min ?? 0}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function CustomSlider<T extends FieldValues>(
  props: CustomSliderProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFSlider {...(props as RHFSliderProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledSliderProps;
  return <SliderCore {...rest} value={value} onChange={onChange} />;
}

"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonNumberInputProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  showStepper?: boolean;
}

type RHFNumberInputProps<T extends FieldValues> = CommonNumberInputProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledNumberInputProps = CommonNumberInputProps & {
  control?: never;
  name?: never;
  value: number | null;
  onChange: (val: number | null) => void;
};

export type CustomNumberInputProps<T extends FieldValues> =
  | RHFNumberInputProps<T>
  | ControlledNumberInputProps;

interface NumberInputCoreProps extends CommonNumberInputProps {
  value: number | null;
  onChange: (val: number | null) => void;
  error?: string;
  inputId?: string;
}

function clamp(val: number, min?: number, max?: number): number {
  if (min !== undefined && val < min) return min;
  if (max !== undefined && val > max) return max;
  return val;
}

function NumberInputCore({
  label,
  placeholder,
  disabled,
  className,
  description,
  required,
  min,
  max,
  step = 1,
  showStepper = true,
  value,
  onChange,
  error,
  inputId,
}: NumberInputCoreProps) {
  const id = inputId ?? label?.toLowerCase().replace(/\s+/g, "-");

  const handleRawChange = (raw: string) => {
    if (raw === "" || raw === "-") {
      onChange(null);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const step_ = (dir: 1 | -1) => {
    const current = value ?? 0;
    const next = clamp(current + dir * step, min, max);
    onChange(next);
  };

  const handleBlur = () => {
    if (value !== null) {
      onChange(clamp(value, min, max));
    }
  };

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={id}
      className={className}
    >
      <div className="relative flex">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          value={value ?? ""}
          onChange={(e) => handleRawChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          aria-invalid={error ? true : undefined}
          className={cn(
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            showStepper && "pr-8",
          )}
        />
        {showStepper && (
          <div className="absolute right-0 top-0 flex h-full flex-col border-l border-input">
            <Button
              type="button"
              variant="ghost"
              disabled={disabled || (max !== undefined && (value ?? 0) >= max)}
              onClick={() => step_(1)}
              className="h-1/2 w-7 rounded-none rounded-tr-md px-0 text-muted-foreground hover:text-foreground"
              aria-label="Increment"
              tabIndex={-1}
            >
              <ChevronUpIcon className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled || (min !== undefined && (value ?? 0) <= min)}
              onClick={() => step_(-1)}
              className="h-1/2 w-7 rounded-none rounded-br-md border-t border-input px-0 text-muted-foreground hover:text-foreground"
              aria-label="Decrement"
              tabIndex={-1}
            >
              <ChevronDownIcon className="size-3" />
            </Button>
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
}

function RHFNumberInput<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFNumberInputProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <NumberInputCore
      {...props}
      value={field.value ?? null}
      onChange={(val) => field.onChange(val)}
      error={fieldState.error?.message}
      inputId={String(name)}
    />
  );
}

export function CustomNumberInput<T extends FieldValues>(
  props: CustomNumberInputProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFNumberInput {...(props as RHFNumberInputProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledNumberInputProps;
  return <NumberInputCore {...rest} value={value} onChange={onChange} />;
}

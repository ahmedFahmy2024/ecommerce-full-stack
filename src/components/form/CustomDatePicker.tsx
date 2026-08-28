"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonDatePickerProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
}

type RHFDatePickerProps<T extends FieldValues> = CommonDatePickerProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledDatePickerProps = CommonDatePickerProps & {
  control?: never;
  name?: never;
  value: Date | undefined;
  onChange: (val: Date | undefined) => void;
};

export type CustomDatePickerProps<T extends FieldValues> =
  | RHFDatePickerProps<T>
  | ControlledDatePickerProps;

interface DatePickerCoreProps extends CommonDatePickerProps {
  value: Date | undefined;
  onChange: (val: Date | undefined) => void;
  error?: string;
}

function DatePickerCore({
  label,
  placeholder,
  disabled,
  className,
  description,
  required,
  value,
  onChange,
  error,
}: DatePickerCoreProps) {
  const [open, setOpen] = useState(false);

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {value ? formatDate(value) : (placeholder ?? "Pick a date")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            captionLayout="dropdown"
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </FormFieldWrapper>
  );
}

function RHFDatePicker<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFDatePickerProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <DatePickerCore
      {...props}
      value={field.value ?? undefined}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function CustomDatePicker<T extends FieldValues>(
  props: CustomDatePickerProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFDatePicker {...(props as RHFDatePickerProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledDatePickerProps;
  return <DatePickerCore {...rest} value={value} onChange={onChange} />;
}

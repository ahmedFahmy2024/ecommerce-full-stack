"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
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
import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonRangePickerProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
}

type RHFRangePickerProps<T extends FieldValues> = CommonRangePickerProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledRangePickerProps = CommonRangePickerProps & {
  control?: never;
  name?: never;
  value: DateRange | undefined;
  onChange: (val: DateRange | undefined) => void;
};

export type CustomRangePickerProps<T extends FieldValues> =
  | RHFRangePickerProps<T>
  | ControlledRangePickerProps;

interface RangePickerCoreProps extends CommonRangePickerProps {
  value: DateRange | undefined;
  onChange: (val: DateRange | undefined) => void;
  error?: string;
}

function formatRange(range: DateRange | undefined): string | null {
  if (!range?.from) return null;
  if (range.to)
    return `${format(range.from, "LLL dd, y")} - ${format(range.to, "LLL dd, y")}`;
  return format(range.from, "LLL dd, y");
}

function RangePickerCore({
  label,
  placeholder,
  disabled,
  className,
  description,
  required,
  value,
  onChange,
  error,
}: RangePickerCoreProps) {
  const [open, setOpen] = useState(false);
  const displayText = formatRange(value);

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
              !displayText && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {displayText ?? placeholder ?? "Pick a date range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            captionLayout="dropdown"
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            numberOfMonths={2}
            onSelect={(range) => {
              onChange(range ?? undefined);
              if (
                range?.from &&
                range?.to &&
                range.from.getTime() !== range.to.getTime()
              )
                setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </FormFieldWrapper>
  );
}

function RHFRangePicker<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFRangePickerProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <RangePickerCore
      {...props}
      value={field.value ?? undefined}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function CustomRangePicker<T extends FieldValues>(
  props: CustomRangePickerProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFRangePicker {...(props as RHFRangePickerProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledRangePickerProps;
  return <RangePickerCore {...rest} value={value} onChange={onChange} />;
}

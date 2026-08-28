"use client";

import { format } from "date-fns";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonDateTimePickerProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
}

type RHFDateTimePickerProps<T extends FieldValues> =
  CommonDateTimePickerProps & {
    control: Control<T>;
    name: Path<T>;
    value?: never;
    onChange?: never;
  };

type ControlledDateTimePickerProps = CommonDateTimePickerProps & {
  control?: never;
  name?: never;
  value: Date | undefined;
  onChange: (val: Date | undefined) => void;
};

export type CustomDateTimePickerProps<T extends FieldValues> =
  | RHFDateTimePickerProps<T>
  | ControlledDateTimePickerProps;

interface DateTimePickerCoreProps extends CommonDateTimePickerProps {
  value: Date | undefined;
  onChange: (val: Date | undefined) => void;
  error?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function DateTimePickerCore({
  label,
  placeholder,
  disabled,
  className,
  description,
  required,
  value,
  onChange,
  error,
}: DateTimePickerCoreProps) {
  const [open, setOpen] = useState(false);

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    const next = new Date(date);
    if (value) {
      next.setHours(value.getHours(), value.getMinutes());
    }
    onChange(next);
  }

  function handleTimeChange(type: "hour" | "minute", val: number) {
    const next = value ? new Date(value) : new Date();
    if (type === "hour") next.setHours(val);
    else next.setMinutes(val);
    onChange(next);
  }

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
            {value
              ? format(value, "MM/dd/yyyy HH:mm")
              : (placeholder ?? "Pick a date & time")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="sm:flex">
            <Calendar
              captionLayout="dropdown"
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
            />
            <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {HOURS.slice()
                    .reverse()
                    .map((hour) => (
                      <Button
                        key={hour}
                        size="icon"
                        variant={
                          value && value.getHours() === hour
                            ? "default"
                            : "ghost"
                        }
                        className="aspect-square shrink-0 sm:w-full"
                        onClick={() => handleTimeChange("hour", hour)}
                      >
                        {String(hour).padStart(2, "0")}
                      </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {MINUTES.map((minute) => (
                    <Button
                      key={minute}
                      size="icon"
                      variant={
                        value && value.getMinutes() === minute
                          ? "default"
                          : "ghost"
                      }
                      className="aspect-square shrink-0 sm:w-full"
                      onClick={() => handleTimeChange("minute", minute)}
                    >
                      {String(minute).padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </FormFieldWrapper>
  );
}

function RHFDateTimePicker<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFDateTimePickerProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <DateTimePickerCore
      {...props}
      value={field.value ?? undefined}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function CustomDateTimePicker<T extends FieldValues>(
  props: CustomDateTimePickerProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFDateTimePicker {...(props as RHFDateTimePickerProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledDateTimePickerProps;
  return <DateTimePickerCore {...rest} value={value} onChange={onChange} />;
}

"use client";

import * as React from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommonPhoneInputProps {
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  placeholder?: string;
  defaultCountry?: RPNInput.Country;
}

type RHFPhoneInputProps<T extends FieldValues> = CommonPhoneInputProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledPhoneInputProps = CommonPhoneInputProps & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomPhoneInputProps<T extends FieldValues> =
  | RHFPhoneInputProps<T>
  | ControlledPhoneInputProps;

// ─── Sub-components ───────────────────────────────────────────────────────────

const PhoneInputField = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input ref={ref} className={cn("rounded-s-none", className)} {...props} />
));
PhoneInputField.displayName = "PhoneInputField";

type CountrySelectOption = { label: string; value: RPNInput.Country };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
  error?: boolean;
};

function CountrySelect({
  disabled,
  value,
  onChange,
  options,
  error,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            "flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10",
          )}
        >
          <FlagComponent country={value} countryName={value} />
          <ChevronsUpDownIcon
            className={cn("-mr-2 size-4 opacity-50", disabled && "hidden")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-60">
                {options
                  .filter((o) => o.value)
                  .map((option) => (
                    <CommandItem
                      key={option.value}
                      className="gap-2"
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <FlagComponent
                        country={option.value}
                        countryName={option.label}
                      />
                      <span className="flex-1 text-sm">{option.label}</span>
                      <span className="text-sm text-muted-foreground">
                        +{RPNInput.getCountryCallingCode(option.value)}
                      </span>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          option.value === value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FlagComponent({ country, countryName }: RPNInput.FlagProps) {
  const Flag = flags[country];
  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20">
      {Flag && <Flag title={countryName} />}
    </span>
  );
}

// ─── Core ─────────────────────────────────────────────────────────────────────

interface PhoneInputCoreProps extends CommonPhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

function PhoneInputCore({
  label,
  description,
  disabled,
  className,
  required,
  placeholder,
  defaultCountry = "US",
  value,
  onChange,
  error,
}: PhoneInputCoreProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <RPNInput.default
        className="flex"
        international
        defaultCountry={defaultCountry}
        flagComponent={FlagComponent}
        countrySelectComponent={(props) => (
          <CountrySelect {...props} error={!!error} />
        )}
        inputComponent={PhoneInputField}
        placeholder={placeholder ?? "Enter phone number"}
        disabled={disabled}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        aria-invalid={error ? true : undefined}
      />
    </FormFieldWrapper>
  );
}

// ─── RHF wrapper ──────────────────────────────────────────────────────────────

function RHFPhoneInput<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFPhoneInputProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <PhoneInputCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function CustomPhoneInput<T extends FieldValues>(
  props: CustomPhoneInputProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFPhoneInput {...(props as RHFPhoneInputProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledPhoneInputProps;
  return <PhoneInputCore {...rest} value={value} onChange={onChange} />;
}

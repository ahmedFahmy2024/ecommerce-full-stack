"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonOTPInputProps {
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  /** Total number of OTP digits. Default 6. */
  length?: 4 | 6 | 8;
  /** Insert a separator in the middle. Default true for length ≥ 6. */
  showSeparator?: boolean;
}

type RHFOTPInputProps<T extends FieldValues> = CommonOTPInputProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledOTPInputProps = CommonOTPInputProps & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomOTPInputProps<T extends FieldValues> =
  | RHFOTPInputProps<T>
  | ControlledOTPInputProps;

interface OTPInputCoreProps extends CommonOTPInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

function OTPInputCore({
  label,
  description,
  disabled,
  className,
  required,
  length = 6,
  showSeparator,
  value,
  onChange,
  error,
}: OTPInputCoreProps) {
  const mid = length / 2;
  const separator = showSeparator ?? length >= 6;

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <InputOTP
        maxLength={length}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
      >
        <InputOTPGroup>
          {Array.from({ length: separator ? mid : length }, (_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
        {separator && (
          <>
            <InputOTPSeparator />
            <InputOTPGroup>
              {Array.from({ length: mid }, (_, i) => (
                <InputOTPSlot key={i + mid} index={i + mid} />
              ))}
            </InputOTPGroup>
          </>
        )}
      </InputOTP>
    </FormFieldWrapper>
  );
}

function RHFOTPInput<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFOTPInputProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <OTPInputCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function CustomOTPInput<T extends FieldValues>(
  props: CustomOTPInputProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFOTPInput {...(props as RHFOTPInputProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledOTPInputProps;
  return <OTPInputCore {...rest} value={value} onChange={onChange} />;
}

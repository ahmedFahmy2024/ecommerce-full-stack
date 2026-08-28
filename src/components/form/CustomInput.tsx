"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonInputProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
  type?: "text" | "email" | "password";
}

type RHFInputProps<T extends FieldValues> = CommonInputProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledInputProps = CommonInputProps & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomInputProps<T extends FieldValues> =
  | RHFInputProps<T>
  | ControlledInputProps;

interface InputCoreProps extends CommonInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  inputId?: string;
}

function InputCore({
  label,
  placeholder,
  disabled,
  className,
  description,
  required,
  type = "text",
  value,
  onChange,
  error,
  inputId,
}: InputCoreProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;
  const id = inputId ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={id}
      className={className}
    >
      <div className="relative">
        <Input
          id={id}
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(isPassword && "pr-9")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        )}
      </div>
    </FormFieldWrapper>
  );
}

function RHFInput<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFInputProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <InputCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
      inputId={String(name)}
    />
  );
}

export function CustomInput<T extends FieldValues>(props: CustomInputProps<T>) {
  if ("control" in props && props.control !== undefined) {
    return <RHFInput {...(props as RHFInputProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledInputProps;
  return <InputCore {...rest} value={value} onChange={onChange} />;
}

"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import type { VariantProps } from "class-variance-authority";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toggleVariants } from "@/components/ui/toggle";
import { FormFieldWrapper } from "./FormFieldWrapper";

export interface ToggleOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
}

interface CommonToggleGroupProps {
  options: ToggleOption[];
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  /** "single" enforces exactly one selection, "multiple" allows many. Default "single". */
  type?: "single" | "multiple";
  variant?: VariantProps<typeof toggleVariants>["variant"];
  size?: VariantProps<typeof toggleVariants>["size"];
  orientation?: "horizontal" | "vertical";
}

// Single-select RHF
type RHFToggleSingleProps<T extends FieldValues> = CommonToggleGroupProps & {
  type?: "single";
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

// Multi-select RHF
type RHFToggleMultiProps<T extends FieldValues> = CommonToggleGroupProps & {
  type: "multiple";
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

// Single-select controlled
type ControlledToggleSingleProps = CommonToggleGroupProps & {
  type?: "single";
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

// Multi-select controlled
type ControlledToggleMultiProps = CommonToggleGroupProps & {
  type: "multiple";
  control?: never;
  name?: never;
  value: string[];
  onChange: (val: string[]) => void;
};

export type CustomToggleGroupProps<T extends FieldValues> =
  | RHFToggleSingleProps<T>
  | RHFToggleMultiProps<T>
  | ControlledToggleSingleProps
  | ControlledToggleMultiProps;

// ─── Core ─────────────────────────────────────────────────────────────────────

interface ToggleSingleCoreProps extends CommonToggleGroupProps {
  type?: "single";
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

interface ToggleMultiCoreProps extends CommonToggleGroupProps {
  type: "multiple";
  value: string[];
  onChange: (val: string[]) => void;
  error?: string;
}

type ToggleGroupCoreProps = ToggleSingleCoreProps | ToggleMultiCoreProps;

function ToggleGroupCore(props: ToggleGroupCoreProps) {
  const {
    options,
    label,
    description,
    disabled,
    className,
    required,
    variant = "outline",
    size = "default",
    orientation = "horizontal",
    error,
  } = props;

  const sharedGroupProps = {
    variant,
    size,
    orientation,
    disabled,
    spacing: 1 as const,
    "aria-invalid": error ? (true as const) : undefined,
  };

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      {props.type === "multiple" ? (
        <ToggleGroup
          {...sharedGroupProps}
          type="multiple"
          value={props.value}
          onValueChange={(val) => props.onChange(val ?? [])}
        >
          {options.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled ?? disabled}
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <ToggleGroup
          {...sharedGroupProps}
          type="single"
          value={props.value}
          onValueChange={(val) => {
            if (val) props.onChange(val);
          }}
        >
          {options.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled ?? disabled}
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </FormFieldWrapper>
  );
}

// ─── RHF wrappers ─────────────────────────────────────────────────────────────

function RHFToggleGroup<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFToggleSingleProps<T> | RHFToggleMultiProps<T>) {
  const { field, fieldState } = useController({ control, name });

  if (props.type === "multiple") {
    return (
      <ToggleGroupCore
        {...(props as Omit<RHFToggleMultiProps<T>, "control" | "name">)}
        value={Array.isArray(field.value) ? field.value : []}
        onChange={field.onChange}
        error={fieldState.error?.message}
      />
    );
  }

  return (
    <ToggleGroupCore
      {...(props as Omit<RHFToggleSingleProps<T>, "control" | "name">)}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function CustomToggleGroup<T extends FieldValues>(
  props: CustomToggleGroupProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return (
      <RHFToggleGroup
        {...(props as RHFToggleSingleProps<T> | RHFToggleMultiProps<T>)}
      />
    );
  }

  if (props.type === "multiple") {
    const { value, onChange, ...rest } = props as ControlledToggleMultiProps;
    return <ToggleGroupCore {...rest} value={value} onChange={onChange} />;
  }

  const { value, onChange, ...rest } = props as ControlledToggleSingleProps;
  return <ToggleGroupCore {...rest} value={value} onChange={onChange} />;
}

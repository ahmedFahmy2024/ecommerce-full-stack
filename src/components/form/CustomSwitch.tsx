"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface CommonSwitchProps {
  label?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  required?: boolean;
  size?: "sm" | "default";
}

type RHFSwitchProps<T extends FieldValues> = CommonSwitchProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledSwitchProps = CommonSwitchProps & {
  control?: never;
  name?: never;
  value: boolean;
  onChange: (val: boolean) => void;
};

export type CustomSwitchProps<T extends FieldValues> =
  | RHFSwitchProps<T>
  | ControlledSwitchProps;

interface SwitchCoreProps extends CommonSwitchProps {
  value: boolean;
  onChange: (val: boolean) => void;
  error?: string;
  switchId?: string;
}

function SwitchCore({
  label,
  disabled,
  className,
  description,
  required,
  size = "default",
  value,
  onChange,
  error,
  switchId,
}: SwitchCoreProps) {
  const id = switchId ?? label?.toLowerCase().replace(/\s+/g, "-") ?? "switch";
  return (
    <FormFieldWrapper
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          checked={value}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={disabled}
          size={size}
          aria-invalid={error ? true : undefined}
        />
        {label && <Label htmlFor={id}>{label}</Label>}
      </div>
    </FormFieldWrapper>
  );
}

function RHFSwitch<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFSwitchProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <SwitchCore
      {...props}
      value={field.value === true}
      onChange={(checked) => field.onChange(checked)}
      error={fieldState.error?.message}
      switchId={String(name)}
    />
  );
}

export function CustomSwitch<T extends FieldValues>(
  props: CustomSwitchProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFSwitch {...(props as RHFSwitchProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledSwitchProps;
  return <SwitchCore {...rest} value={value} onChange={onChange} />;
}

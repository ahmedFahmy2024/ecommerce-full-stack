"use client";

import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import {
  ColorPicker,
  ColorPickerAlphaSlider,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { FormFieldWrapper } from "./FormFieldWrapper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommonColorPickerProps {
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  /** Show the alpha (opacity) slider. Default true. */
  withAlpha?: boolean;
}

type RHFColorPickerProps<T extends FieldValues> = CommonColorPickerProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledColorPickerProps = CommonColorPickerProps & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomColorPickerProps<T extends FieldValues> =
  | RHFColorPickerProps<T>
  | ControlledColorPickerProps;

// ─── Core ─────────────────────────────────────────────────────────────────────

interface ColorPickerCoreProps extends CommonColorPickerProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

function ColorPickerCore({
  label,
  description,
  disabled,
  className,
  required,
  withAlpha = true,
  value,
  onChange,
  error,
}: ColorPickerCoreProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <ColorPicker
        value={value || "#000000"}
        onValueChange={onChange}
        disabled={disabled}
      >
        <ColorPickerTrigger asChild>
          <Button
            variant="outline"
            className="flex h-9 w-full items-center justify-start gap-2 px-3"
            aria-invalid={error ? true : undefined}
          >
            <ColorPickerSwatch className="size-5 shrink-0 rounded-sm" />
            <span className="font-mono text-sm text-muted-foreground">
              {value || "#000000"}
            </span>
          </Button>
        </ColorPickerTrigger>
        <ColorPickerContent align="start">
          <ColorPickerArea />
          <div className="flex items-center gap-2">
            <ColorPickerEyeDropper />
            <div className="flex flex-1 flex-col gap-2">
              <ColorPickerHueSlider />
              {withAlpha && <ColorPickerAlphaSlider />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ColorPickerFormatSelect />
            <ColorPickerInput className="flex-1" withoutAlpha={!withAlpha} />
          </div>
        </ColorPickerContent>
      </ColorPicker>
    </FormFieldWrapper>
  );
}

// ─── RHF wrapper ──────────────────────────────────────────────────────────────

function RHFColorPicker<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFColorPickerProps<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <ColorPickerCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function CustomColorPicker<T extends FieldValues>(
  props: CustomColorPickerProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFColorPicker {...(props as RHFColorPickerProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledColorPickerProps;
  return <ColorPickerCore {...rest} value={value} onChange={onChange} />;
}

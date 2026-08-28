"use client";

import { Upload, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommonFileUploadProps {
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
}

type RHFFileUploadProps<T extends FieldValues> = CommonFileUploadProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type ControlledFileUploadProps = CommonFileUploadProps & {
  control?: never;
  name?: never;
  value: File[];
  onChange: (files: File[]) => void;
};

export type CustomFileUploadProps<T extends FieldValues> =
  | RHFFileUploadProps<T>
  | ControlledFileUploadProps;

// ─── Core ─────────────────────────────────────────────────────────────────────

interface FileUploadCoreProps extends CommonFileUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

function FileUploadCore({
  label,
  description,
  required,
  disabled,
  className,
  accept = "image/*",
  maxSizeMB = 4,
  value,
  onChange,
  error,
}: FileUploadCoreProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || disabled) return;
    const maxBytes = maxSizeMB * 1024 * 1024;
    const all = Array.from(incoming);
    const valid: File[] = [];
    const rejected: File[] = [];
    for (const f of all) {
      (f.size <= maxBytes ? valid : rejected).push(f);
    }
    if (rejected.length > 0) {
      toast.error(
        rejected.length === 1
          ? `"${rejected[0].name}" exceeds the ${maxSizeMB} MB limit`
          : `${rejected.length} files exceed the ${maxSizeMB} MB limit`,
      );
    }
    if (valid.length === 0) return;
    onChange([...value, ...valid]);
  };

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-controls={inputId}
        className={cn(
          "border-2 border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-muted/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
          disabled && "pointer-events-none opacity-50",
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        <div className="mb-2 bg-muted rounded-full p-3">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Drop files here</p>
        <p className="text-xs text-muted-foreground mt-1">
          or <span className="text-primary font-medium">click to browse</span> —{" "}
          {maxSizeMB}MB max
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* File list */}
      {value.length > 0 && (
        <ul className="mt-2 space-y-2">
          {value.map((file, i) => (
            <FileRow
              key={file.name + i}
              file={file}
              onRemove={() => removeFile(i)}
            />
          ))}
        </ul>
      )}
    </FormFieldWrapper>
  );
}

// ─── File row ─────────────────────────────────────────────────────────────────

function FileRow({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/");
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled && typeof reader.result === "string") {
        setDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
      reader.abort();
    };
  }, [file, isImage]);

  return (
    <li className="flex items-center gap-2 border border-border rounded-lg p-2">
      <div className="w-16 h-12 bg-muted rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
        {isImage && dataUrl ? (
          <img
            src={dataUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Upload className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(0)} KB
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 hover:text-destructive"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

// ─── RHF wrapper ──────────────────────────────────────────────────────────────

function RHFFileUpload<T extends FieldValues>({
  control,
  name,
  ...props
}: RHFFileUploadProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const files: File[] = Array.isArray(field.value) ? field.value : [];

  return (
    <FileUploadCore
      {...props}
      value={files}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function CustomFileUpload<T extends FieldValues>(
  props: CustomFileUploadProps<T>,
) {
  if ("control" in props && props.control !== undefined) {
    return <RHFFileUpload {...(props as RHFFileUploadProps<T>)} />;
  }
  const { value, onChange, ...rest } = props as ControlledFileUploadProps;
  return <FileUploadCore {...rest} value={value} onChange={onChange} />;
}

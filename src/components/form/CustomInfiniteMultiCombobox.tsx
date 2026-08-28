"use client";
"use no memo";

import * as React from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Loader2Icon } from "lucide-react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { FormFieldWrapper } from "./FormFieldWrapper";
import type {
  InfiniteComboboxPage,
  InfiniteComboboxQueryParams,
} from "./CustomInfiniteCombobox";

// Re-export shared types so consumers can import from one place
export type { InfiniteComboboxPage, InfiniteComboboxQueryParams };

interface CommonInfiniteMultiComboboxProps<T> {
  queryKey: unknown[];
  queryFn: (
    params: InfiniteComboboxQueryParams,
  ) => Promise<InfiniteComboboxPage<T>>;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  limit?: number;
  placeholder?: string;
  enableSearch?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

type RHFInfiniteMultiComboboxProps<
  T,
  F extends FieldValues,
> = CommonInfiniteMultiComboboxProps<T> & {
  control: Control<F>;
  name: Path<F>;
  value?: never;
  onChange?: never;
};

type ControlledInfiniteMultiComboboxProps<T> =
  CommonInfiniteMultiComboboxProps<T> & {
    control?: never;
    name?: never;
    value: string[];
    onChange: (val: string[]) => void;
  };

export type CustomInfiniteMultiComboboxProps<
  T,
  F extends FieldValues = FieldValues,
> =
  | RHFInfiniteMultiComboboxProps<T, F>
  | ControlledInfiniteMultiComboboxProps<T>;

interface InfiniteMultiComboboxCoreProps<T>
  extends CommonInfiniteMultiComboboxProps<T> {
  value: string[];
  onChange: (val: string[]) => void;
  error?: string;
}

function InfiniteMultiComboboxCore<T>({
  queryKey,
  queryFn,
  getLabel,
  getValue,
  limit = 10,
  placeholder,
  enableSearch = true,
  disabled,
  label,
  description,
  required,
  className,
  value,
  onChange,
  error,
}: InfiniteMultiComboboxCoreProps<T>) {
  const [inputValue, setInputValue] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: [...queryKey, debouncedSearch, limit],
      queryFn: ({ pageParam }) =>
        queryFn({
          page: pageParam as number,
          limit,
          search: debouncedSearch || undefined,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.hasNextPage ? (lastPageParam as number) + 1 : undefined,
    });

  const seenValues = new Set<string>();
  const items = (data?.pages.flatMap((p) => p.items) ?? []).filter((item) => {
    const v = getValue(item);
    if (seenValues.has(v)) return false;
    seenValues.add(v);
    return true;
  });

  // Persist labels for selected values that may scroll out of the loaded pages.
  const labelMapRef = React.useRef(new Map<string, string>());
  for (const item of items) {
    labelMapRef.current.set(getValue(item), getLabel(item));
  }

  const { ref: sentinelRef, inView } = useInView({ rootMargin: "50px" });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, fetchNextPage]);

  const anchor = useComboboxAnchor();

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Combobox
        multiple
        value={value}
        onValueChange={(val) => onChange(val ?? [])}
        onInputValueChange={enableSearch ? (v) => setInputValue(v) : undefined}
        disabled={disabled}
      >
        <ComboboxChips ref={anchor} aria-invalid={error ? true : undefined}>
          {value.map((v) => (
            <ComboboxChip key={v}>
              {labelMapRef.current.get(v) ?? v}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            placeholder={
              value.length === 0 ? (placeholder ?? "Search...") : undefined
            }
            readOnly={!enableSearch}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxList>
            {items.map((item) => (
              <ComboboxItem key={getValue(item)} value={getValue(item)}>
                {getLabel(item)}
              </ComboboxItem>
            ))}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-2">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={sentinelRef} />
            {!isFetching && items.length === 0 && (
              <ComboboxEmpty>No results found.</ComboboxEmpty>
            )}
            {isFetching && !isFetchingNextPage && items.length === 0 && (
              <div className="flex items-center justify-center py-2">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FormFieldWrapper>
  );
}

function RHFInfiniteMultiCombobox<T, F extends FieldValues>({
  control,
  name,
  ...props
}: RHFInfiniteMultiComboboxProps<T, F>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <InfiniteMultiComboboxCore
      {...props}
      value={Array.isArray(field.value) ? field.value : []}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function CustomInfiniteMultiCombobox<
  T,
  F extends FieldValues = FieldValues,
>(props: CustomInfiniteMultiComboboxProps<T, F>) {
  if ("control" in props && props.control !== undefined) {
    return (
      <RHFInfiniteMultiCombobox
        {...(props as RHFInfiniteMultiComboboxProps<T, F>)}
      />
    );
  }
  const { value, onChange, ...rest } =
    props as ControlledInfiniteMultiComboboxProps<T>;
  return (
    <InfiniteMultiComboboxCore {...rest} value={value} onChange={onChange} />
  );
}

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
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { FormFieldWrapper } from "./FormFieldWrapper";

export interface InfiniteComboboxQueryParams {
  page: number;
  limit: number;
  search?: string;
}

export interface InfiniteComboboxPage<T> {
  items: T[];
  hasNextPage: boolean;
}

interface CommonInfiniteComboboxProps<T> {
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
  /** Pre-seed the label for the currently selected value so it shows immediately
   *  even before that item is fetched via infinite scroll. */
  initialLabel?: string;
}

type RHFInfiniteComboboxProps<
  T,
  F extends FieldValues,
> = CommonInfiniteComboboxProps<T> & {
  control: Control<F>;
  name: Path<F>;
  value?: never;
  onChange?: never;
};

type ControlledInfiniteComboboxProps<T> = CommonInfiniteComboboxProps<T> & {
  control?: never;
  name?: never;
  value: string;
  onChange: (val: string) => void;
};

export type CustomInfiniteComboboxProps<
  T,
  F extends FieldValues = FieldValues,
> = RHFInfiniteComboboxProps<T, F> | ControlledInfiniteComboboxProps<T>;

interface InfiniteComboboxCoreProps<T> extends CommonInfiniteComboboxProps<T> {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  initialLabel?: string;
}

function InfiniteComboboxCore<T>({
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
  initialLabel,
  value,
  onChange,
  error,
}: InfiniteComboboxCoreProps<T>) {
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
      enabled: !disabled,
    });

  const seenValues = new Set<string>();
  const items = (data?.pages.flatMap((p) => p.items) ?? []).filter((item) => {
    const v = getValue(item);
    if (seenValues.has(v)) return false;
    seenValues.add(v);
    return true;
  });

  // Accumulate all seen labels so the input shows the name after selection,
  // not the raw value (id). useRef so it persists across re-renders without
  // causing additional renders. Pre-seeded with initialLabel so the selected
  // item displays correctly before its page is fetched.
  const labelMapRef = React.useRef(new Map<string, string>());
  if (value && initialLabel && !labelMapRef.current.has(value)) {
    labelMapRef.current.set(value, initialLabel);
  }
  for (const item of items) {
    labelMapRef.current.set(getValue(item), getLabel(item));
  }

  const { ref: sentinelRef, inView } = useInView({ rootMargin: "50px" });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, fetchNextPage]);

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Combobox
        value={value}
        onValueChange={(val) => onChange(val ?? "")}
        onInputValueChange={
          enableSearch
            ? (v, details) => {
                if (details?.reason !== "input-change") return;
                setInputValue(v);
              }
            : undefined
        }
        itemToStringLabel={(v) =>
          labelMapRef.current.get(v as string) ?? (v as string)
        }
        filter={null}
        disabled={disabled}
      >
        <ComboboxInput
          placeholder={placeholder ?? "Search..."}
          showTrigger
          showClear
          disabled={disabled}
          className="w-full"
          readOnly={!enableSearch}
        />
        <ComboboxContent>
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

function RHFInfiniteCombobox<T, F extends FieldValues>({
  control,
  name,
  ...props
}: RHFInfiniteComboboxProps<T, F>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <InfiniteComboboxCore
      {...props}
      value={field.value ?? ""}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function CustomInfiniteCombobox<T, F extends FieldValues = FieldValues>(
  props: CustomInfiniteComboboxProps<T, F>,
) {
  if ("control" in props && props.control !== undefined) {
    return (
      <RHFInfiniteCombobox {...(props as RHFInfiniteComboboxProps<T, F>)} />
    );
  }
  const { value, onChange, ...rest } =
    props as ControlledInfiniteComboboxProps<T>;
  return <InfiniteComboboxCore {...rest} value={value} onChange={onChange} />;
}

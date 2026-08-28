"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from "nuqs";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import {
  AdvancedFilterSheet,
  FilterRow,
  FilterSection,
} from "@/components/data-table/advanced-filter-sheet";
import { CustomSelect } from "@/components/form/CustomSelect";
import { CustomSwitch } from "@/components/form/CustomSwitch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Separator } from "@/components/ui/separator";
import { useClassMaterialsOptions } from "@/features/classes/hooks/use-class-materials-options";
import { formatDate } from "@/lib/format";
import { SortOrderEnum } from "../schemas/users-in-class";

// ── URL parsers ───────────────────────────────────────────────────────────────

const sortOrderParsers = {
  sortOrder: parseAsStringEnum<SortOrderEnum>(
    Object.values(SortOrderEnum),
  ).withDefault(SortOrderEnum.ALPHABETICAL),
};

const numberParsers = {
  minSuccessCount: parseAsInteger,
  maxSuccessCount: parseAsInteger,
  minAttendanceCount: parseAsInteger,
  maxAttendanceCount: parseAsInteger,
  minSuccessRate: parseAsInteger,
  maxSuccessRate: parseAsInteger,
  minCompletionRate: parseAsInteger,
  maxCompletionRate: parseAsInteger,
};

const booleanParsers = {
  hasNotTakenAnyQuiz: parseAsBoolean,
  onlyPassed: parseAsBoolean,
  onlyFailed: parseAsBoolean,
};

const dateParsers = {
  lastExamBefore: parseAsString.withDefault(""),
  lastExamAfter: parseAsString.withDefault(""),
  examDateFrom: parseAsString.withDefault(""),
  examDateTo: parseAsString.withDefault(""),
  notExaminedSince: parseAsString.withDefault(""),
};

// ── Zod schema ────────────────────────────────────────────────────────────────

const filterSchema = z
  .object({
    sortOrder: z.nativeEnum(SortOrderEnum),
    materialId: z.string(),
    minSuccessCount: z.number().int().min(0).nullable(),
    maxSuccessCount: z.number().int().min(0).nullable(),
    minAttendanceCount: z.number().int().min(0).nullable(),
    maxAttendanceCount: z.number().int().min(0).nullable(),
    minSuccessRate: z.number().int().min(0).max(100).nullable(),
    maxSuccessRate: z.number().int().min(0).max(100).nullable(),
    minCompletionRate: z.number().int().min(0).max(100).nullable(),
    maxCompletionRate: z.number().int().min(0).max(100).nullable(),
    hasNotTakenAnyQuiz: z.boolean().nullable(),
    onlyPassed: z.boolean().nullable(),
    onlyFailed: z.boolean().nullable(),
    lastExamBefore: z.string(),
    lastExamAfter: z.string(),
    examDateFrom: z.string(),
    examDateTo: z.string(),
    notExaminedSince: z.string(),
  })
  .superRefine((data, ctx) => {
    if (
      data.minSuccessCount != null &&
      data.maxSuccessCount != null &&
      data.minSuccessCount > data.maxSuccessCount
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxSuccessCount"],
        message: "Must be ≥ min",
      });
    }
    if (
      data.minAttendanceCount != null &&
      data.maxAttendanceCount != null &&
      data.minAttendanceCount > data.maxAttendanceCount
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxAttendanceCount"],
        message: "Must be ≥ min",
      });
    }
    if (
      data.minSuccessRate != null &&
      data.maxSuccessRate != null &&
      data.minSuccessRate > data.maxSuccessRate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxSuccessRate"],
        message: "Must be ≥ min",
      });
    }
    if (
      data.minCompletionRate != null &&
      data.maxCompletionRate != null &&
      data.minCompletionRate > data.maxCompletionRate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxCompletionRate"],
        message: "Must be ≥ min",
      });
    }
  });

type FilterValues = z.infer<typeof filterSchema>;

const EMPTY_VALUES: FilterValues = {
  sortOrder: SortOrderEnum.ALPHABETICAL,
  materialId: "",
  minSuccessCount: null,
  maxSuccessCount: null,
  minAttendanceCount: null,
  maxAttendanceCount: null,
  minSuccessRate: null,
  maxSuccessRate: null,
  minCompletionRate: null,
  maxCompletionRate: null,
  hasNotTakenAnyQuiz: null,
  onlyPassed: null,
  onlyFailed: null,
  lastExamBefore: "",
  lastExamAfter: "",
  examDateFrom: "",
  examDateTo: "",
  notExaminedSince: "",
};

// ── props ─────────────────────────────────────────────────────────────────────

interface UsersInClassFilterSheetProps {
  classId: string;
  labels: {
    title: string;
    apply: string;
    reset: string;
    sortOrder: string;
    sortOrderOptions: Record<SortOrderEnum, string>;
    materialId: string;
    minSuccessCount: string;
    maxSuccessCount: string;
    minAttendanceCount: string;
    maxAttendanceCount: string;
    minSuccessRate: string;
    maxSuccessRate: string;
    minCompletionRate: string;
    maxCompletionRate: string;
    hasNotTakenAnyQuiz: string;
    onlyPassed: string;
    onlyFailed: string;
    lastExamBefore: string;
    lastExamAfter: string;
    examDateFrom: string;
    examDateTo: string;
    notExaminedSince: string;
    sections: {
      sorting: string;
      success: string;
      attendance: string;
      dates: string;
    };
  };
}

// ── component ─────────────────────────────────────────────────────────────────

export function UsersInClassFilterSheet({
  classId,
  labels,
}: UsersInClassFilterSheetProps) {
  const [open, setOpen] = React.useState(false);

  const [materialsEnabled, setMaterialsEnabled] = React.useState(false);
  const { data: materialOptions = [], isLoading: isMaterialsLoading } =
    useClassMaterialsOptions(classId, materialsEnabled);

  const [urlSortOrder, setUrlSortOrder] = useQueryStates(sortOrderParsers, {
    shallow: false,
    clearOnDefault: true,
  });
  const [urlNumbers, setUrlNumbers] = useQueryStates(numberParsers, {
    shallow: false,
    clearOnDefault: true,
  });
  const [urlBooleans, setUrlBooleans] = useQueryStates(booleanParsers, {
    shallow: false,
    clearOnDefault: true,
  });
  const [urlDates, setUrlDates] = useQueryStates(dateParsers, {
    shallow: false,
    clearOnDefault: true,
  });
  const [urlMaterialId, setUrlMaterialId] = useQueryState(
    "material_id",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, clearOnDefault: true }),
  );

  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: EMPTY_VALUES,
  });

  const onOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        setMaterialsEnabled(true);
        form.reset({
          sortOrder: urlSortOrder.sortOrder,
          materialId: urlMaterialId ?? "",
          ...urlNumbers,
          ...urlBooleans,
          ...urlDates,
        } as FilterValues);
      }
      setOpen(next);
    },
    [urlSortOrder, urlMaterialId, urlNumbers, urlBooleans, urlDates, form],
  );

  const activeCount = React.useMemo(() => {
    let count = 0;
    if (urlSortOrder.sortOrder !== SortOrderEnum.ALPHABETICAL) count++;
    if (urlMaterialId) count++;
    for (const v of Object.values(urlNumbers)) if (v != null) count++;
    for (const v of Object.values(urlBooleans)) if (v != null) count++;
    for (const v of Object.values(urlDates)) if (v) count++;
    return count;
  }, [urlSortOrder, urlMaterialId, urlNumbers, urlBooleans, urlDates]);

  const onValid = React.useCallback(
    (values: FilterValues) => {
      setUrlSortOrder({ sortOrder: values.sortOrder });
      setUrlMaterialId(values.materialId);
      setUrlNumbers({
        minSuccessCount: values.minSuccessCount,
        maxSuccessCount: values.maxSuccessCount,
        minAttendanceCount: values.minAttendanceCount,
        maxAttendanceCount: values.maxAttendanceCount,
        minSuccessRate: values.minSuccessRate,
        maxSuccessRate: values.maxSuccessRate,
        minCompletionRate: values.minCompletionRate,
        maxCompletionRate: values.maxCompletionRate,
      });
      setUrlBooleans({
        hasNotTakenAnyQuiz: values.hasNotTakenAnyQuiz,
        onlyPassed: values.onlyPassed,
        onlyFailed: values.onlyFailed,
      });
      setUrlDates({
        lastExamBefore: values.lastExamBefore,
        lastExamAfter: values.lastExamAfter,
        examDateFrom: values.examDateFrom,
        examDateTo: values.examDateTo,
        notExaminedSince: values.notExaminedSince,
      });
      setOpen(false);
    },
    [
      setUrlSortOrder,
      setUrlMaterialId,
      setUrlNumbers,
      setUrlBooleans,
      setUrlDates,
    ],
  );

  const onReset = React.useCallback(() => {
    form.reset(EMPTY_VALUES);
    setUrlSortOrder({ sortOrder: SortOrderEnum.ALPHABETICAL });
    setUrlMaterialId("");
    setUrlNumbers({
      minSuccessCount: null,
      maxSuccessCount: null,
      minAttendanceCount: null,
      maxAttendanceCount: null,
      minSuccessRate: null,
      maxSuccessRate: null,
      minCompletionRate: null,
      maxCompletionRate: null,
    });
    setUrlBooleans({
      hasNotTakenAnyQuiz: null,
      onlyPassed: null,
      onlyFailed: null,
    });
    setUrlDates({
      lastExamBefore: "",
      lastExamAfter: "",
      examDateFrom: "",
      examDateTo: "",
      notExaminedSince: "",
    });
  }, [
    form,
    setUrlSortOrder,
    setUrlMaterialId,
    setUrlNumbers,
    setUrlBooleans,
    setUrlDates,
  ]);

  const sortOrderOptions = Object.values(SortOrderEnum).map((v) => ({
    value: v,
    label: labels.sortOrderOptions[v],
  }));

  return (
    <AdvancedFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title={labels.title}
      applyLabel={labels.apply}
      resetLabel={labels.reset}
      activeCount={activeCount}
      onApply={form.handleSubmit(onValid)}
      onReset={onReset}
    >
      {/* Sorting & Scope */}
      <FilterSection title={labels.sections.sorting}>
        <FilterRow label={labels.sortOrder}>
          <CustomSelect
            control={form.control}
            name="sortOrder"
            options={sortOrderOptions}
          />
        </FilterRow>

        <FilterRow label={labels.materialId}>
          <Controller
            control={form.control}
            name="materialId"
            render={({ field }) => (
              <MaterialPicker
                value={field.value}
                onChange={field.onChange}
                options={materialOptions}
                isLoading={isMaterialsLoading}
                placeholder={labels.materialId}
              />
            )}
          />
        </FilterRow>
      </FilterSection>

      <Separator />

      {/* Success */}
      <FilterSection title={labels.sections.success}>
        <FilterRow label={labels.minSuccessCount}>
          <Controller
            control={form.control}
            name="minSuccessCount"
            render={({ field, fieldState }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                error={fieldState.error?.message}
              />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.maxSuccessCount}>
          <Controller
            control={form.control}
            name="maxSuccessCount"
            render={({ field, fieldState }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                error={fieldState.error?.message}
              />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.minSuccessRate}>
          <Controller
            control={form.control}
            name="minSuccessRate"
            render={({ field, fieldState }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                max={100}
                unit="%"
                error={fieldState.error?.message}
              />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.maxSuccessRate}>
          <Controller
            control={form.control}
            name="maxSuccessRate"
            render={({ field, fieldState }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                max={100}
                unit="%"
                error={fieldState.error?.message}
              />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.onlyPassed}>
          <Controller
            control={form.control}
            name="onlyPassed"
            render={({ field }) => (
              <CustomSwitch
                size="sm"
                value={field.value === true}
                onChange={(checked) => field.onChange(checked || null)}
              />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.onlyFailed}>
          <Controller
            control={form.control}
            name="onlyFailed"
            render={({ field }) => (
              <CustomSwitch
                size="sm"
                value={field.value === true}
                onChange={(checked) => field.onChange(checked || null)}
              />
            )}
          />
        </FilterRow>
      </FilterSection>

      <Separator />

      {/* Attendance */}
      <FilterSection title={labels.sections.attendance}>
        <FilterRow label={labels.minAttendanceCount}>
          <Controller
            control={form.control}
            name="minAttendanceCount"
            render={({ field, fieldState }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                error={fieldState.error?.message}
              />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.maxAttendanceCount}>
          <Controller
            control={form.control}
            name="maxAttendanceCount"
            render={({ field, fieldState }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                error={fieldState.error?.message}
              />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.minCompletionRate}>
          <Controller
            control={form.control}
            name="minCompletionRate"
            render={({ field, fieldState }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                max={100}
                unit="%"
                error={fieldState.error?.message}
              />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.maxCompletionRate}>
          <Controller
            control={form.control}
            name="maxCompletionRate"
            render={({ field, fieldState }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                max={100}
                unit="%"
                error={fieldState.error?.message}
              />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.hasNotTakenAnyQuiz}>
          <Controller
            control={form.control}
            name="hasNotTakenAnyQuiz"
            render={({ field }) => (
              <CustomSwitch
                size="sm"
                value={field.value === true}
                onChange={(checked) => field.onChange(checked || null)}
              />
            )}
          />
        </FilterRow>
      </FilterSection>

      <Separator />

      {/* Dates */}
      <FilterSection title={labels.sections.dates}>
        <FilterRow label={labels.lastExamBefore}>
          <Controller
            control={form.control}
            name="lastExamBefore"
            render={({ field }) => (
              <DatePickerInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.lastExamAfter}>
          <Controller
            control={form.control}
            name="lastExamAfter"
            render={({ field }) => (
              <DatePickerInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.examDateFrom}>
          <Controller
            control={form.control}
            name="examDateFrom"
            render={({ field }) => (
              <DatePickerInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.examDateTo}>
          <Controller
            control={form.control}
            name="examDateTo"
            render={({ field }) => (
              <DatePickerInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FilterRow>
        <FilterRow label={labels.notExaminedSince}>
          <Controller
            control={form.control}
            name="notExaminedSince"
            render={({ field }) => (
              <DatePickerInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FilterRow>
      </FilterSection>
    </AdvancedFilterSheet>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function MaterialPicker({
  value,
  onChange,
  options,
  isLoading,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  isLoading: boolean;
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-44 justify-between font-normal"
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              {placeholder}
            </span>
          ) : (
            <span className={selected ? "" : "text-muted-foreground"}>
              {selected ? selected.label : placeholder}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            {value && (
              <span
                role="button"
                tabIndex={0}
                className="rounded p-0.5 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onChange("");
                  }
                }}
              >
                <X className="size-3" />
              </span>
            )}
            <ChevronsUpDown className="size-3.5 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            {isLoading ? (
              <CommandGroup>
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              </CommandGroup>
            ) : (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup
                  className="max-h-[260px] overflow-y-scroll"
                  onWheel={(e) => e.stopPropagation()}
                >
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => {
                        onChange(opt.value === value ? "" : opt.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={
                          value === opt.value ? "opacity-100" : "opacity-0"
                        }
                      />
                      <span className="truncate">{opt.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  unit,
  error,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  unit?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="relative w-28">
        <Input
          type="number"
          inputMode="numeric"
          className="h-8 w-full"
          style={unit ? { paddingRight: "2rem" } : undefined}
          value={value ?? ""}
          min={min}
          max={max}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? null : Number(raw));
          }}
        />
        {unit && (
          <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
            {unit}
          </span>
        )}
      </div>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}

function DatePickerInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const date = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-36 justify-start font-normal"
        >
          <CalendarIcon className="text-muted-foreground" />
          {date ? (
            <span>{formatDate(date)}</span>
          ) : (
            <span className="text-muted-foreground">Pick date…</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          captionLayout="dropdown"
          mode="single"
          selected={date}
          onSelect={(d) => {
            onChange(d ? d.toISOString() : "");
            setOpen(false);
          }}
        />
        {date && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

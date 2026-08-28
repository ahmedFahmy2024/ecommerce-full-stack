"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

import { FormFieldWrapper } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api";
import { PERMISSIONS } from "@/services/api/queries";
import type { PaginatedResponse } from "@/types/api";
import type { Permission } from "../types";
import {
  ACTION_ORDER,
  type ActionType,
  applyGlobalPreset,
  applyResourcePreset,
  groupPermissions,
  type PresetKey,
  type ResourceGroup,
} from "../lib/permission-grouping";

const PRESETS: PresetKey[] = ["view", "editor", "full", "clear"];

async function fetchAllPermissions() {
  const res = await apiClient<PaginatedResponse<Permission>>(PERMISSIONS, {
    query: { page: 1, limit: 500 },
  });
  return res.data.items;
}

interface PermissionsSelectorProps<F extends FieldValues> {
  control: Control<F>;
  name: Path<F>;
  label?: string;
  description?: string;
  required?: boolean;
}

export function PermissionsSelector<F extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
}: PermissionsSelectorProps<F>) {
  "use no memo";
  const t = useTranslations("Roles.permissionsSelector");
  const tAction = useTranslations("Roles.permissionsSelector.actions");
  const tPreset = useTranslations("Roles.permissionsSelector.presets");

  const { field, fieldState } = useController({ control, name });
  const valueArray: string[] = Array.isArray(field.value) ? field.value : [];
  const selectedSet = React.useMemo(() => new Set(valueArray), [valueArray]);

  const { data, isLoading } = useQuery({
    queryKey: ["permissions-all"],
    queryFn: fetchAllPermissions,
    staleTime: 5 * 60 * 1000,
  });

  const { resources, other } = React.useMemo(
    () => groupPermissions(data ?? []),
    [data],
  );

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounced(search, 200);

  const visibleResources = React.useMemo(() => {
    if (!debouncedSearch.trim()) return resources;
    const q = debouncedSearch.toLowerCase();
    return resources
      .map((group) => {
        const labelHit = group.label.toLowerCase().includes(q);
        const matchedEntries = group.entries.filter(
          (e) =>
            labelHit ||
            e.action.toLowerCase().includes(q) ||
            e.permission.permissionType.toLowerCase().includes(q) ||
            e.permission.displayName?.toLowerCase().includes(q),
        );
        if (labelHit) return group;
        if (matchedEntries.length === 0) return null;
        return { ...group, entries: matchedEntries };
      })
      .filter((g): g is ResourceGroup => g !== null);
  }, [resources, debouncedSearch]);

  const visibleOther = React.useMemo(() => {
    if (!debouncedSearch.trim()) return other;
    const q = debouncedSearch.toLowerCase();
    return other.filter(
      (p) =>
        p.permissionType.toLowerCase().includes(q) ||
        p.displayName?.toLowerCase().includes(q),
    );
  }, [other, debouncedSearch]);

  const [activeKey, setActiveKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!visibleResources.length && !visibleOther.length) {
      setActiveKey(null);
      return;
    }
    if (activeKey === "__other__" && visibleOther.length) return;
    if (activeKey && visibleResources.some((g) => g.key === activeKey)) return;
    if (visibleResources.length) setActiveKey(visibleResources[0].key);
    else setActiveKey("__other__");
  }, [visibleResources, visibleOther, activeKey]);

  const otherIds = React.useMemo(
    () => new Set(other.map((p) => p.id)),
    [other],
  );

  const allResourceIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const g of resources)
      for (const e of g.entries) set.add(e.permission.id);
    return set;
  }, [resources]);

  function setSelected(next: Set<string>) {
    field.onChange(Array.from(next));
  }

  function toggleId(id: string, checked: boolean) {
    const next = new Set(selectedSet);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  }

  function handleResourcePreset(group: ResourceGroup, preset: PresetKey) {
    setSelected(applyResourcePreset(group, preset, selectedSet));
  }

  function handleGlobalPreset(preset: PresetKey) {
    setSelected(applyGlobalPreset(resources, preset, selectedSet, otherIds));
  }

  function handleSelectAllOther(checked: boolean) {
    const next = new Set(selectedSet);
    for (const p of other) {
      if (checked) next.add(p.id);
      else next.delete(p.id);
    }
    setSelected(next);
  }

  function getGroupSelectedCount(group: ResourceGroup) {
    let count = 0;
    for (const e of group.entries) {
      if (selectedSet.has(e.permission.id)) count++;
    }
    return count;
  }

  const totalSelected = selectedSet.size;

  const activeGroup =
    activeKey && activeKey !== "__other__"
      ? (visibleResources.find((g) => g.key === activeKey) ?? null)
      : null;
  const isOtherActive = activeKey === "__other__";

  if (isLoading) {
    return (
      <FormFieldWrapper
        label={label}
        description={description}
        required={required}
        error={fieldState.error?.message}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px_1fr]">
          <Skeleton className="h-[400px] w-full rounded-md" />
          <Skeleton className="h-[400px] w-full rounded-md" />
        </div>
      </FormFieldWrapper>
    );
  }

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      required={required}
      error={fieldState.error?.message}
    >
      <div className="flex flex-col gap-3 rounded-md border bg-card p-3">
        {/* Global toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {t("selectedCount", { count: totalSelected })}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {t("applyToAll")}
          </span>
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => handleGlobalPreset(preset)}
              >
                {tPreset(preset)}
              </Button>
            ))}
          </div>
          <div className="ms-auto relative w-full md:w-64">
            <SearchIcon className="absolute start-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-8 ps-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px_1fr]">
          {/* Left rail */}
          <ScrollArea className="h-[460px] rounded-md border bg-background">
            <ul className="flex flex-col p-1">
              {visibleResources.map((group) => {
                const count = getGroupSelectedCount(group);
                const total = group.entries.length;
                const isActive = activeKey === group.key;
                const isFull = count === total && total > 0;
                return (
                  <li key={group.key}>
                    <button
                      type="button"
                      onClick={() => setActiveKey(group.key)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50",
                      )}
                    >
                      <span className="truncate">{group.label}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[10px]",
                          isFull
                            ? "bg-primary text-primary-foreground"
                            : count > 0
                              ? "bg-secondary text-secondary-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {count}/{total}
                      </span>
                    </button>
                  </li>
                );
              })}
              {visibleOther.length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveKey("__other__")}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors",
                      isOtherActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <span className="truncate italic text-muted-foreground">
                      {t("other")}
                    </span>
                    <span className="shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {visibleOther.filter((p) => selectedSet.has(p.id)).length}
                      /{visibleOther.length}
                    </span>
                  </button>
                </li>
              )}
              {visibleResources.length === 0 && visibleOther.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {t("noResults")}
                </li>
              )}
            </ul>
          </ScrollArea>

          {/* Right panel */}
          <div className="rounded-md border bg-background">
            {activeGroup && (
              <ResourcePanel
                group={activeGroup}
                selectedSet={selectedSet}
                onToggle={toggleId}
                onPreset={(preset) => handleResourcePreset(activeGroup, preset)}
                t={t}
                tAction={tAction}
                tPreset={tPreset}
              />
            )}
            {isOtherActive && (
              <OtherPanel
                items={visibleOther}
                selectedSet={selectedSet}
                onToggle={toggleId}
                onSelectAll={handleSelectAllOther}
                allCount={other.length}
                t={t}
              />
            )}
            {!activeGroup && !isOtherActive && (
              <div className="flex h-full min-h-[460px] items-center justify-center text-sm text-muted-foreground">
                {t("selectResource")}
              </div>
            )}
          </div>
        </div>

        {allResourceIds.size === 0 && other.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        )}
      </div>
    </FormFieldWrapper>
  );
}

interface ResourcePanelProps {
  group: ResourceGroup;
  selectedSet: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onPreset: (preset: PresetKey) => void;
  t: ReturnType<typeof useTranslations<"Roles.permissionsSelector">>;
  tAction: ReturnType<
    typeof useTranslations<"Roles.permissionsSelector.actions">
  >;
  tPreset: ReturnType<
    typeof useTranslations<"Roles.permissionsSelector.presets">
  >;
}

function ResourcePanel({
  group,
  selectedSet,
  onToggle,
  onPreset,
  t,
  tAction,
  tPreset,
}: ResourcePanelProps) {
  const knownActions = new Set<ActionType>(ACTION_ORDER);
  const standard = group.entries.filter((e) => knownActions.has(e.action));
  const extra = group.entries.filter((e) => !knownActions.has(e.action));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{group.label}</h3>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => onPreset(preset)}
            >
              {tPreset(preset)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {standard.map(({ permission, action }) => {
          const checked = selectedSet.has(permission.id);
          return (
            <label
              key={permission.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                checked ? "border-primary bg-primary/5" : "hover:bg-accent/40",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => onToggle(permission.id, v === true)}
              />
              <span className="flex-1">{tAction(action)}</span>
              {checked && <CheckIcon className="size-3.5 text-primary" />}
            </label>
          );
        })}
      </div>

      {extra.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t("otherActions")}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {extra.map(({ permission, action }) => {
              const checked = selectedSet.has(permission.id);
              return (
                <label
                  key={permission.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent/40"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => onToggle(permission.id, v === true)}
                  />
                  <span className="flex-1 font-mono text-xs">
                    {action}_{group.key}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface OtherPanelProps {
  items: Permission[];
  selectedSet: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  allCount: number;
  t: ReturnType<typeof useTranslations<"Roles.permissionsSelector">>;
}

function OtherPanel({
  items,
  selectedSet,
  onToggle,
  onSelectAll,
  allCount,
  t,
}: OtherPanelProps) {
  const allChecked = allCount > 0 && items.every((p) => selectedSet.has(p.id));
  const someChecked = items.some((p) => selectedSet.has(p.id));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t("other")}</h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => onSelectAll(!allChecked)}
        >
          {allChecked || someChecked ? t("presets.clear") : t("selectAll")}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((permission) => {
          const checked = selectedSet.has(permission.id);
          return (
            <label
              key={permission.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
                checked ? "border-primary bg-primary/5" : "hover:bg-accent/40",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => onToggle(permission.id, v === true)}
              />
              <span className="flex-1 font-mono text-xs">
                {permission.permissionType}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

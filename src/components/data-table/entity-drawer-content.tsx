"use client";

import type { Row } from "@tanstack/react-table";
import * as React from "react";

import apiClient from "@/services/api";

interface EntityDrawerContentProps<TList, TDetail> {
  variant: "create" | "update" | "view";
  row: Row<TList> | null;
  detailEndpoint: string | null;
  getId: (data: TList) => string;
  renderForm: (detail?: TDetail) => React.ReactNode;
  renderView?: (detail: TDetail) => React.ReactNode;
  loadingLabel?: string;
}

export function EntityDrawerContent<TList, TDetail>({
  variant,
  row,
  detailEndpoint,
  getId,
  renderForm,
  renderView,
  loadingLabel = "Loading…",
}: EntityDrawerContentProps<TList, TDetail>) {
  const [detail, setDetail] = React.useState<TDetail | null>(null);

  React.useEffect(() => {
    if (variant === "create" || !row) {
      setDetail(null);
      return;
    }
    if (!detailEndpoint) {
      setDetail(row.original as unknown as TDetail);
      return;
    }
    setDetail(null);
    apiClient<TDetail>(detailEndpoint, {
      params: { id: getId(row.original) },
    }).then((res) => setDetail(res.data));
  }, [variant, row, detailEndpoint, getId]);

  if (variant === "create") {
    return <>{renderForm()}</>;
  }

  if (variant === "update") {
    if (!detail) {
      return (
        <div className="text-muted-foreground text-sm">{loadingLabel}</div>
      );
    }
    return <>{renderForm(detail)}</>;
  }

  if (variant === "view") {
    if (!detail) {
      return (
        <div className="text-muted-foreground text-sm">{loadingLabel}</div>
      );
    }
    return <>{renderView?.(detail) ?? null}</>;
  }

  return null;
}

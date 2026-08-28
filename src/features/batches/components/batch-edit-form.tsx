"use client";

import { routes } from "@/constants/routes";
import { useRouter } from "@/i18n/navigation";
import type { BatchDetail } from "../types";
import { BatchForm } from "./batch-form";

interface BatchEditFormProps {
  batch: BatchDetail;
}

export function BatchEditForm({ batch }: BatchEditFormProps) {
  const router = useRouter();
  return (
    <BatchForm
      batch={batch}
      onSuccess={() => router.push(routes.batches.index)}
    />
  );
}

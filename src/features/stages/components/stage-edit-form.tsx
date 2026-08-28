"use client";

import { routes } from "@/constants/routes";
import { useRouter } from "@/i18n/navigation";
import type { StageDetail } from "../types";
import { StageForm } from "./stage-form";

interface StageEditFormProps {
  stage: StageDetail;
}

export function StageEditForm({ stage }: StageEditFormProps) {
  const router = useRouter();
  return (
    <StageForm
      stage={stage}
      onSuccess={() => router.push(routes.stages.index)}
    />
  );
}

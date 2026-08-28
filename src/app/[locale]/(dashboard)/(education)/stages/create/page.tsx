"use client";

import { useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StageForm } from "@/features/stages/components/stage-form";
import { routes } from "@/constants/routes";

export default function CreateStagePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title="Create Stage" />
      <StageForm onSuccess={() => router.push(routes.stages.index)} />
    </div>
  );
}

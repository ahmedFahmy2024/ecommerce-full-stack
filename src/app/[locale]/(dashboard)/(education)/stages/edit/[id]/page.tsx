import { PageHeader } from "@/components/layout/page-header";
import { StageEditForm } from "@/features/stages/components/stage-edit-form";
import type { StageDetail } from "@/features/stages/types";
import apiClient from "@/services/api";
import { STAGES_DETAILS } from "@/services/api/queries";

interface EditStagePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStagePage({ params }: EditStagePageProps) {
  const { id } = await params;
  const res = await apiClient<StageDetail>(STAGES_DETAILS, { params: { id } });
  const stage = res.data;

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title="Edit Stage" />
      {stage && <StageEditForm stage={stage} />}
    </div>
  );
}

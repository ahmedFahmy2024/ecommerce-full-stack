import { PageHeader } from "@/components/layout/page-header";
import { BatchEditForm } from "@/features/batches/components/batch-edit-form";
import type { BatchDetail } from "@/features/batches/types";
import apiClient from "@/services/api";
import { BATCHES_DETAILS } from "@/services/api/queries";

interface EditBatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBatchPage({ params }: EditBatchPageProps) {
  const { id } = await params;
  const res = await apiClient<BatchDetail>(BATCHES_DETAILS, { params: { id } });
  const batch = res.data;

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title="Edit Batch" />
      {batch && <BatchEditForm batch={batch} />}
    </div>
  );
}

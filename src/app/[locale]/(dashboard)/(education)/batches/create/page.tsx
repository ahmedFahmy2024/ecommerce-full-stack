"use client";

import { useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { BatchForm } from "@/features/batches/components/batch-form";
import { routes } from "@/constants/routes";

export default function CreateBatchPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title="Create Batch" />
      <BatchForm onSuccess={() => router.push(routes.batches.index)} />
    </div>
  );
}

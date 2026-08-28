import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/constants/routes";
import type { BatchDetail, BatchStatus } from "@/features/batches/types";
import { Link } from "@/i18n/navigation";
import apiClient from "@/services/api";
import { BATCHES_DETAILS } from "@/services/api/queries";

interface ViewBatchPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_VARIANT: Record<
  BatchStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
  finished: "secondary",
  deleted: "destructive",
};

export default async function ViewBatchPage({ params }: ViewBatchPageProps) {
  const { id } = await params;
  const res = await apiClient<BatchDetail>(BATCHES_DETAILS, { params: { id } });
  const batch = res.data;

  if (!batch) return null;

  const catTitle = batch.category
    ? batch.category.title.ar || batch.category.title.en
    : "—";

  const stageTitle = batch.stage
    ? batch.stage.title.ar || batch.stage.title.en
    : "—";

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title="View Batch">
        <Button asChild size="sm" variant="outline">
          <Link href={routes.batches.edit(batch.id)}>Edit</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
        <div>
          <p className="text-muted-foreground text-sm">Title (English)</p>
          <p className="font-medium">{batch.title.en || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Title (Arabic)</p>
          <p className="font-medium">{batch.title.ar || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Category</p>
          <p className="font-medium">{catTitle}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Stage</p>
          <p className="font-medium">{stageTitle}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Status</p>
          <Badge variant={STATUS_VARIANT[batch.status as BatchStatus] ?? "secondary"}>
            {batch.status}
          </Badge>
        </div>
        {batch.notes && (
          <div className="sm:col-span-2">
            <p className="text-muted-foreground text-sm">Notes</p>
            <p className="font-medium">{batch.notes.en || batch.notes.ar}</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-sm">Created At</p>
          <p className="font-medium">
            {new Date(batch.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

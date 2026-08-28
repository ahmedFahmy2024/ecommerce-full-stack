import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/constants/routes";
import type { StageDetail } from "@/features/stages/types";
import { Link } from "@/i18n/navigation";
import apiClient from "@/services/api";
import { STAGES_DETAILS } from "@/services/api/queries";

interface ViewStagePageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewStagePage({ params }: ViewStagePageProps) {
  const { id } = await params;
  const res = await apiClient<StageDetail>(STAGES_DETAILS, { params: { id } });
  const stage = res.data;

  if (!stage) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title="View Stage">
        <Button asChild size="sm" variant="outline">
          <Link href={routes.stages.edit(stage.id)}>Edit</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
        <div>
          <p className="text-muted-foreground text-sm">Title (English)</p>
          <p className="font-medium">{stage.title.en || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Title (Arabic)</p>
          <p className="font-medium">{stage.title.ar || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Category</p>
          <p className="font-medium">
            {stage.category
              ? stage.category.title.ar || stage.category.title.en
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Status</p>
          <Badge variant={stage.status === "active" ? "default" : "secondary"}>
            {stage.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Created At</p>
          <p className="font-medium">
            {new Date(stage.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/constants/routes";
import type { CategoryDetail } from "@/features/categories/types";
import { Link } from "@/i18n/navigation";
import apiClient from "@/services/api";
import { CATEGORIES_DETAILS } from "@/services/api/queries";

interface ViewCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewCategoryPage({
  params,
}: ViewCategoryPageProps) {
  const { id } = await params;
  const res = await apiClient<CategoryDetail>(CATEGORIES_DETAILS, {
    params: { id },
  });
  const category = res.data;

  if (!category) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title="View Category">
        <Button asChild size="sm" variant="outline">
          <Link href={routes.categories.edit(category.id)}>Edit</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
        <div>
          <p className="text-muted-foreground text-sm">Title (English)</p>
          <p className="font-medium">{category.title.en || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Title (Arabic)</p>
          <p className="font-medium">{category.title.ar || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Status</p>
          <Badge
            variant={category.status === "active" ? "default" : "secondary"}
          >
            {category.status}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Created At</p>
          <p className="font-medium">
            {new Date(category.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

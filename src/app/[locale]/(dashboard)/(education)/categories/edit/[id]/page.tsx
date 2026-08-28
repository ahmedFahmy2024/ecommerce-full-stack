import { PageHeader } from "@/components/layout/page-header";
import { CategoryEditForm } from "@/features/categories/components/category-edit-form";
import type { CategoryDetail } from "@/features/categories/types";
import apiClient from "@/services/api";
import { CATEGORIES_DETAILS } from "@/services/api/queries";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const res = await apiClient<CategoryDetail>(CATEGORIES_DETAILS, {
    params: { id },
  });
  const category = res.data;

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title="Edit Category" />
      {category && <CategoryEditForm category={category} />}
    </div>
  );
}

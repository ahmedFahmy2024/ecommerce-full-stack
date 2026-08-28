"use client";

import { useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryForm } from "@/features/categories/components/category-form";
import { routes } from "@/constants/routes";

export default function CreateCategoryPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title="Create Category" />
      <CategoryForm onSuccess={() => router.push(routes.categories.index)} />
    </div>
  );
}

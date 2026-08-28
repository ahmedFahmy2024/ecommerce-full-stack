"use client";

import { routes } from "@/constants/routes";
import { useRouter } from "@/i18n/navigation";
import type { CategoryDetail } from "../types";
import { CategoryForm } from "./category-form";

interface CategoryEditFormProps {
  category: CategoryDetail;
}

export function CategoryEditForm({ category }: CategoryEditFormProps) {
  const router = useRouter();
  return (
    <CategoryForm
      category={category}
      onSuccess={() => router.push(routes.categories.index)}
    />
  );
}

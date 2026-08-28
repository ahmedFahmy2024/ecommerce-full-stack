export type CategoryStatus = "active" | "inactive";

/** Shape returned by GET /categories (list) — title is a plain localized string */
export interface Category {
  id: string;
  title: string;
  status: CategoryStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /categories/{id} (detail) — title is a localized object */
export interface CategoryDetail {
  id: string;
  title: { en: string; ar: string };
  status: CategoryStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StageStatus = "active" | "not_active";

export interface StageCategory {
  id: string;
  title: { ar: string; en: string };
  status: string;
}

/** Shape returned by GET /stages (list) — title is a plain string */
export interface Stage {
  id: string;
  title: string;
  status: StageStatus;
  isActive: boolean;
  category?: StageCategory;
  category_id?: string;
  parent?: Stage | null;
  parent_id?: string | null;
  children?: Stage[];
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /stages/{id} (detail) — title is a localized object */
export interface StageDetail {
  id: string;
  title: { en: string; ar: string };
  status: StageStatus;
  isActive: boolean;
  category?: StageCategory;
  category_id?: string;
  parent?: StageDetail | null;
  parent_id?: string | null;
  createdAt: string;
  updatedAt: string;
}

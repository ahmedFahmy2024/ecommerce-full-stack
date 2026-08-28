export type BatchStatus =
  | "active"
  | "inactive"
  | "deleted"
  | "pending"
  | "finished";

export interface BatchCategory {
  id: string;
  title: { ar: string; en: string };
  status: string;
}

export interface BatchStage {
  id: string;
  title: { ar: string; en: string };
  status: string;
  parent_id?: string | null;
  category_id?: string;
}

/** Shape returned by GET /batches (list) — title and notes are plain strings */
export interface Batch {
  id: string;
  title: string;
  status: BatchStatus;
  notes: string | null;
  isActive: boolean;
  category?: BatchCategory;
  category_id?: string;
  stage?: BatchStage;
  stage_id?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /batches/{id} (detail) — title/notes are localized objects */
export interface BatchDetail {
  id: string;
  title: { en: string; ar: string };
  status: BatchStatus;
  notes: { en: string; ar: string } | null;
  isActive: boolean;
  category?: BatchCategory;
  category_id?: string;
  stage?: BatchStage;
  stage_id?: string;
  createdAt: string;
  updatedAt: string;
}

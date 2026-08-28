export interface ClassMaterial {
  id: string;
  materialDetailId: string;
  name: string;
  status: boolean;
  sessionsCount: number;
  classesCount: number;
  startDate: string;
  endDate: string;
  description: string | null;
  cover?: string;
  materialContents: unknown[];
}

export interface ClassCategory {
  id: string;
  title: string;
  isActive: boolean;
}

export interface ClassStage {
  id: string;
  title: string;
  isActive: boolean;
}

export interface ClassBatch {
  id: string;
  title: string;
  notes: string | null;
  isActive: boolean;
}

export interface ClassStatistics {
  userClassesCount: number;
  materialSessionsCount: number;
  materialsCount: number;
}

export interface Class {
  id: string;
  name: { ar: string; en: string };
  notes: { ar: string; en: string } | null;
  gender: "male" | "female" | "both";
  status: "active" | "not_active" | "deleted" | "pending" | "finished";
  telegram_code: string;
  limit_sound: number | null;
  category: ClassCategory;
  stage: ClassStage;
  batch: ClassBatch;
  materials: ClassMaterial[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usersCount: number;
  statistics: ClassStatistics;
  displayName: string;
}

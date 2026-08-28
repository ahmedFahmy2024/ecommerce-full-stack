export interface MaterialContent {
  contentId: string;
  type: "quiz" | "live" | "recorded" | "file" | "form" | "media" | string;
  formId?: string;
  fullUrlPath?: string | null;
  mediaId?: string | null;
}

export interface Material {
  id: string;
  materialDetailId: string;
  name: string;
  status: boolean;
  sessionsCount: number;
  classesCount: number;
  startDate: string;
  endDate: string;
  description: string | null;
  cover: string | null;
  materialContents: MaterialContent[];
  createdAt: string;
  updatedAt: string;
}

// Detailed shape returned by GET /materials/{id} — used by the edit form.
// Mirrors the backend MaterialResource DTO.

export type MaterialDetailType =
  | "live"
  | "recorded"
  | "recorded_limit"
  | "both"
  | "presence";

export type MaterialType = "subject" | "community" | "quran";

export interface LocalizedField {
  en: string;
  ar: string;
}

export interface MaterialDetailItem {
  id: string;
  type: MaterialDetailType;
  material_type: MaterialType;
  supervisor_id: string | null;
  telegram_code: string | null;
  start_date: string | null;
  end_date: string | null;
  evaluation_form_id: string | null;
  attend_form_id: string | null;
  quiz_form_id: string | null;
  count_session: number | null;
  show_total_result: boolean | null;
  show_result_attendance: boolean | null;
  show_evaluation: boolean | null;
  show_quiz: boolean | null;
  allow_result_to_instructor: boolean | null;
  allow_result_to_supervisor: boolean | null;
  close_quiz_after_hours: number | null;
  close_eval_after_hours: number | null;
  close_attend_after_hours: number | null;
  send_live_link_before_hours: number | null;
  duration_btw_test: number | null;
  max_attempt: number | null;
  instructor_id: string | null;
  matrial_id: string;
  stage_id: string | null;
  batch_id: string | null;
  class_id: string | null;
  isActive: boolean;
}

export interface MaterialAttachment {
  id: string;
  fullUrlPath: string;
}

export interface MaterialMedia {
  id: string;
  fullUrlPath?: string;
}

export interface MaterialDetailed {
  id: string;
  title: LocalizedField;
  description: LocalizedField | null;
  cover: MaterialMedia | null;
  policies: Record<string, unknown> | null;
  demoVideo: string | null;
  isActive: boolean;
  attachments: MaterialAttachment[] | null;
  materialDetail: MaterialDetailItem[];
  createdAt: string;
  updatedAt: string;
}

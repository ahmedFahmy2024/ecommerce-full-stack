export interface UserRole {
  id: string;
  name: { ar: string; en: string };
  guardName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermission {
  id: string;
  permissionType: string;
  displayName: { ar: string; en: string };
  guardName: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  source_class_id: string | null;
  target_class_id: string | null;
  activity_type: string;
  changed_by: string;
  changed_by_user: { id: string; fullName: string };
  description: string | null;
  createdAt: string;
  target_class_name: { ar: string; en: string } | null;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  educationQualification: string | null;
  nationalityId: string;
  nationality: { id: string; name: string };
  userParentId: string | null;
  status: "active" | "inactive" | "banned";
  gender: "male" | "female";
  graduationYear: string | null;
  telegramCode: string | null;
  fingerprint: string | null;
  fingerprintStatus: boolean;
  background_application: boolean;
  add_to_home_screen: boolean;
  notes: string | null;
  countryId: string;
  countryName: string;
  birthDate: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  roles: UserRole[];
  permissions: UserPermission[];
  activityLogs: UserActivityLog[];
}

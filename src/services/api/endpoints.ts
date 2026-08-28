import type { EndpointConfig } from "@/types/api";
import {
  SYSTEM_USERS_FORGET_PASSWORD,
  SYSTEM_USERS_LOGIN,
  SYSTEM_USERS_LOGOUT,
  SYSTEM_USERS_RESET_PASSWORD,
  USERS,
  USERS_CREATE,
  USERS_UPDATE,
  USERS_DELETE,
  USERS_DETAILS,
  USERS_PERMISSIONS,
  USERS_CLASSES_WITH_STATISTICS,
  STUDENTS,
  STUDENTS_CREATE,
  STUDENTS_UPDATE,
  STUDENTS_DELETE,
  STUDENTS_DETAILS,
  INSTRUCTORS,
  INSTRUCTORS_CREATE,
  INSTRUCTORS_UPDATE,
  INSTRUCTORS_DELETE,
  INSTRUCTORS_DETAILS,
  SUPERVISORS,
  SUPERVISORS_CREATE,
  SUPERVISORS_UPDATE,
  SUPERVISORS_DELETE,
  SUPERVISORS_DETAILS,
  COUNTRIES,
  COUNTRIES_DETAILS,
  COUNTRIES_CREATE,
  COUNTRIES_UPDATE,
  COUNTRIES_DELETE,
  COUNTRIES_TOGGLE_ACTIVE,
  CITIES,
  CITIES_DETAILS,
  CITIES_CREATE,
  CITIES_UPDATE,
  CITIES_DELETE,
  CITIES_TOGGLE_ACTIVE,
  DISTRICTS,
  DISTRICTS_DETAILS,
  DISTRICTS_TOGGLE_ACTIVE,
  DISTRICTS_CREATE,
  DISTRICTS_UPDATE,
  DISTRICTS_DELETE,
  ROLES,
  ROLES_DETAILS,
  ROLES_CREATE,
  ROLES_UPDATE,
  ROLES_DELETE,
  GENERAL_SETTINGS,
  GENERAL_SETTINGS_DETAILS,
  GENERAL_SETTINGS_DETAILS_SLUG,
  GENERAL_SETTINGS_CREATE,
  GENERAL_SETTINGS_UPDATE,
  GENERAL_SETTINGS_DELETE,
  PROFILE,
  PROFILE_UPDATE,
  REPORTS_STATISTICS,
  REPORTS_CHARTS,
  DOWNLOAD_EXCEL,
  IMPORT_EXCEL,
  EXPORT_EXCEL,
  CATEGORIES,
  CATEGORIES_DETAILS,
  CATEGORIES_CREATE,
  CATEGORIES_UPDATE,
  CATEGORIES_DELETE,
  CATEGORIES_TOGGLE_ACTIVE,
  STAGES,
  STAGES_DETAILS,
  STAGES_CREATE,
  STAGES_UPDATE,
  STAGES_DELETE,
  STAGES_TOGGLE_ACTIVE,
  BATCHES,
  BATCHES_DETAILS,
  BATCHES_CREATE,
  BATCHES_UPDATE,
  BATCHES_DELETE,
  BATCHES_TOGGLE_ACTIVE,
  PERMISSIONS,
  PERMISSIONS_DETAILS,
  PERMISSIONS_CREATE,
  PERMISSIONS_UPDATE,
  PERMISSIONS_DELETE,
  CLASSES,
  CLASSES_DETAILS,
  CLASSES_MATERIALS,
  CLASSES_CREATE,
  CLASSES_UPDATE,
  CLASSES_DELETE,
  CLASSES_TOGGLE_ACTIVE,
  USER_CLASSES,
  USER_CLASSES_DETAILS,
  USER_CLASSES_CREATE,
  USER_CLASSES_BULK_ASSIGN,
  USER_CLASSES_BULK_MOVE,
  USER_CLASSES_UPDATE,
  USER_CLASSES_DELETE,
  USER_CLASSES_TOGGLE_ACTIVE,
  MATERIALS,
  MATERIALS_DETAILS,
  MATERIALS_CREATE,
  MATERIALS_UPDATE,
  MATERIALS_DELETE,
  MATERIALS_TOGGLE_ACTIVE,
  MATERIAL_DETAILS,
  MATERIAL_DETAILS_DETAILS,
  MATERIAL_DETAILS_CREATE,
  MATERIAL_DETAILS_UPDATE,
  MATERIAL_DETAILS_DELETE,
  MATERIAL_DETAILS_TOGGLE_ACTIVE,
  MATERIAL_DETAILS_CREATE_BULK,
  MATERIAL_DETAILS_UPDATE_BULK,
  MATERIAL_SESSIONS,
  MATERIAL_SESSIONS_DETAILS,
  MATERIAL_SESSIONS_CREATE,
  MATERIAL_SESSIONS_UPDATE,
  MATERIAL_SESSIONS_DELETE,
  MATERIAL_SESSIONS_TOGGLE_ACTIVE,
  MATERIAL_SESSIONS_BULK,
  MATERIAL_SESSIONS_BULK_COUNT,
  MATERIAL_SESSIONS_REORDER,
  MATERIAL_SESSIONS_CLASSES,
  MATERIAL_SESSIONS_CLONE,
  MATERIAL_SESSIONS_BULK_DELETE,
  MATERIAL_CONTENTS,
  MATERIAL_CONTENTS_DETAILS,
  MATERIAL_CONTENTS_CREATE,
  MATERIAL_CONTENTS_UPDATE,
  MATERIAL_CONTENTS_DELETE,
  MATERIAL_CONTENTS_REORDER,
  MATERIAL_CONTENTS_TOGGLE_ACTIVE,
  CLASSES_BELONG_USERS,
  CLASSES_NOT_BELONG_USERS,
  CLASSES_WITHOUT_MATERIALS,
  USERS_CLASSES_STATISTICS,
  CLASSES_BELONG_USERS_BULK_DELETE,
  MEDIA_ENTITY_TABLES,
  MEDIA_FOLDER,
  MEDIA_DETAILS,
  MEDIA_UPLOAD,
  MEDIA_DELETE,
  FORMS,
  FORMS_DETAILS,
  FORMS_CREATE,
  FORMS_CREATE_COMPREHENSIVE,
  FORMS_UPDATE_COMPREHENSIVE,
  FORMS_DETAILS_COMPREHENSIVE,
  FORMS_UPDATE,
  FORMS_DELETE,
  FORMS_TOGGLE_ACTIVE,
  QUIZZES,
  QUIZZES_DETAILS,
  QUIZZES_CREATE,
  QUIZZES_CREATE_COMPREHENSIVE,
  QUIZZES_UPDATE_COMPREHENSIVE,
  QUIZZES_DETAILS_COMPREHENSIVE,
  QUIZZES_UPDATE,
  QUIZZES_DELETE,
  QUIZZES_TOGGLE_ACTIVE,
  QUIZZES_HEADER_SWAP,
  QUIZZES_QUESTIONS_SWAP,
  QUIZZES_OPTIONS_SWAP,
  QUIZZES_BY_CLASSID_MATERIALID,
  QUIZZES_STUDENTS,
  QUIZZES_RESULT_DETAILS,
  QUIZZES_ASSIGNED_USER,
  QUIZZES_UPDATE_RESULTS_END_DATE,
  VIDEOS,
  VIDEOS_DETAILS,
  VIDEOS_UPLOAD,
  VIDEOS_UPLOAD_STORAGE,
  VIDEOS_DELETE,
  VIDEOS_URLS,
  VIDEOS_EMBED_HTML,
  VIDEOS_FILE_UPLOAD,
  BANNERS,
  BANNERS_DETAILS,
  BANNERS_CREATE,
  BANNERS_UPDATE,
  BANNERS_DELETE,
  BANNERS_TOGGLE_ACTIVE,
  USER_QUIZ_RESULTS,
  USER_QUIZ_RESULTS_DETAILS,
  USER_QUIZ_RESULTS_CREATE,
  USER_QUIZ_RESULTS_UPDATE,
  USER_QUIZ_RESULTS_DELETE,
  FAQS,
  FAQS_DETAILS,
  FAQS_CREATE,
  FAQS_UPDATE,
  FAQS_DELETE,
  FAQS_TOGGLE_ACTIVE,
  NOTIFICATIONS,
  NOTIFICATIONS_DETAILS,
  NOTIFICATIONS_CREATE,
  NOTIFICATIONS_UPDATE,
  NOTIFICATIONS_DELETE,
  NOTIFICATIONS_TOGGLE_ACTIVE,
  STATISTICS,
  SCOPES_SYNC,
  SCOPES_USER,
  SCOPES_USER_RESOURCE,
  SCOPES_WILDCARD_ENABLE,
  SCOPES_WILDCARD_DISABLE,
} from "./queries";

const statistics: Record<string, EndpointConfig> = {
  [STATISTICS]: {
    url: "/statistics",
    config: {
      method: "GET",
    },
  },
};

const scopes: Record<string, EndpointConfig> = {
  [SCOPES_SYNC]: {
    url: "/admin/scopes/sync/batch",
    config: {
      method: "POST",
      showToasts: false,
    },
  },
  [SCOPES_USER]: {
    url: "/admin/scopes/user/{userId}",
    config: {
      method: "GET",
      showToasts: false,
    },
  },
  [SCOPES_USER_RESOURCE]: {
    url: "/admin/scopes/user/{userId}/resource/{resourceType}",
    config: {
      method: "GET",
      showToasts: false,
    },
  },
  [SCOPES_WILDCARD_ENABLE]: {
    url: "/admin/scopes/wildcard/enable",
    config: {
      method: "POST",
      showToasts: false,
    },
  },
  [SCOPES_WILDCARD_DISABLE]: {
    url: "/admin/scopes/wildcard/disable",
    config: {
      method: "POST",
      showToasts: false,
    },
  },
};

const systemUsersAuth: Record<string, EndpointConfig> = {
  [SYSTEM_USERS_LOGIN]: {
    url: "/users/login",
    config: {
      method: "POST",
    },
  },
  [SYSTEM_USERS_LOGOUT]: {
    url: "/users/logout",
    config: {
      method: "POST",
    },
  },
  [SYSTEM_USERS_FORGET_PASSWORD]: {
    url: "/users/forgot-password",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [SYSTEM_USERS_RESET_PASSWORD]: {
    url: "/users/reset-password",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
};

const users: Record<string, EndpointConfig> = {
  [USERS]: {
    url: "/users",
    config: {
      method: "GET",
    },
  },
  [USERS_DETAILS]: {
    url: "/users/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [USERS_CREATE]: {
    url: "/users",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [USERS_UPDATE]: {
    url: "/users/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [USERS_DELETE]: {
    url: "/users/{id}",
    config: {
      method: "DELETE",
    },
  },
  [USERS_CLASSES_WITH_STATISTICS]: {
    url: "/users/{id}/classes-with-statistics",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [USERS_PERMISSIONS]: {
    url: "/users/{id}/permissions",
    config: {
      method: "GET",
    },
  },
};

const students: Record<string, EndpointConfig> = {
  [STUDENTS]: {
    url: "/users",
    config: {
      method: "GET",
    },
  },
  [STUDENTS_DETAILS]: {
    url: "/users/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [STUDENTS_CREATE]: {
    url: "/users",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [STUDENTS_UPDATE]: {
    url: "/users/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [STUDENTS_DELETE]: {
    url: "/users/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const instructors: Record<string, EndpointConfig> = {
  [INSTRUCTORS]: {
    url: "/users",
    config: {
      method: "GET",
    },
  },
  [INSTRUCTORS_DETAILS]: {
    url: "/users/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [INSTRUCTORS_CREATE]: {
    url: "/users",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [INSTRUCTORS_UPDATE]: {
    url: "/users/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [INSTRUCTORS_DELETE]: {
    url: "/users/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const supervisors: Record<string, EndpointConfig> = {
  [SUPERVISORS]: {
    url: "/users",
    config: {
      method: "GET",
    },
  },
  [SUPERVISORS_DETAILS]: {
    url: "/users/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [SUPERVISORS_CREATE]: {
    url: "/users",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [SUPERVISORS_UPDATE]: {
    url: "/users/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [SUPERVISORS_DELETE]: {
    url: "/users/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const roles: Record<string, EndpointConfig> = {
  [ROLES]: {
    url: "/roles",
    config: {
      method: "GET",
    },
  },
  [ROLES_DETAILS]: {
    url: "/roles/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [ROLES_CREATE]: {
    url: "/roles",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [ROLES_UPDATE]: {
    url: "/roles/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [ROLES_DELETE]: {
    url: "/roles/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const permissions: Record<string, EndpointConfig> = {
  [PERMISSIONS]: {
    url: "/permissions",
    config: {
      method: "GET",
    },
  },
  [PERMISSIONS_DETAILS]: {
    url: "/permissions/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [PERMISSIONS_CREATE]: {
    url: "/permissions",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [PERMISSIONS_UPDATE]: {
    url: "/permissions/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [PERMISSIONS_DELETE]: {
    url: "/permissions/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const profile: Record<string, EndpointConfig> = {
  [PROFILE]: {
    url: "/admins/profile",
    config: {
      method: "GET",
    },
  },
  [PROFILE_UPDATE]: {
    url: "/admins/profile",
    config: {
      method: "PATCH",
      headers: { "Content-Type": "multipart/form-data" },
      // showToasts: true,
    },
  },
};

const countries: Record<string, EndpointConfig> = {
  [COUNTRIES]: {
    url: "/countries",
    config: {
      method: "GET",
    },
  },
  [COUNTRIES_DETAILS]: {
    url: "/countries/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [COUNTRIES_CREATE]: {
    url: "/countries",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [COUNTRIES_TOGGLE_ACTIVE]: {
    url: "/countries/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [COUNTRIES_UPDATE]: {
    url: "/countries/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [COUNTRIES_DELETE]: {
    url: "/countries/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const cities: Record<string, EndpointConfig> = {
  [CITIES]: {
    url: "/cities",
    config: {
      method: "GET",
    },
  },
  [CITIES_DETAILS]: {
    url: "/cities/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [CITIES_TOGGLE_ACTIVE]: {
    url: "/cities/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [CITIES_CREATE]: {
    url: "/cities",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [CITIES_UPDATE]: {
    url: "/cities/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [CITIES_DELETE]: {
    url: "/cities/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const districts: Record<string, EndpointConfig> = {
  [DISTRICTS]: {
    url: "/districts",
    config: {
      method: "GET",
    },
  },
  [DISTRICTS_DETAILS]: {
    url: "/districts/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [DISTRICTS_TOGGLE_ACTIVE]: {
    url: "/districts/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [DISTRICTS_CREATE]: {
    url: "/districts",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [DISTRICTS_UPDATE]: {
    url: "/districts/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [DISTRICTS_DELETE]: {
    url: "/districts/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const generalSettings: Record<string, EndpointConfig> = {
  [GENERAL_SETTINGS]: {
    url: "/general-settings",
    config: {
      method: "GET",
    },
  },
  [GENERAL_SETTINGS_DETAILS]: {
    url: "/general-settings/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [GENERAL_SETTINGS_DETAILS_SLUG]: {
    url: "/general-settings/slug/{slug}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [GENERAL_SETTINGS_CREATE]: {
    url: "/general-settings",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [GENERAL_SETTINGS_UPDATE]: {
    url: "/general-settings/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [GENERAL_SETTINGS_DELETE]: {
    url: "/general-settings/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const reports: Record<string, EndpointConfig> = {
  [REPORTS_STATISTICS]: {
    url: "/admin/reports/stats",
    config: {
      method: "GET",
    },
  },
  [REPORTS_CHARTS]: {
    url: "/admin/reports/charts-maps-tables",
    config: {
      method: "GET",
    },
  },
};

const downloadExcel: Record<string, EndpointConfig> = {
  [DOWNLOAD_EXCEL]: {
    url: "/admin/download-excel",
    config: {
      method: "GET",
    },
  },
  [IMPORT_EXCEL]: {
    url: "/admin/import-excel",
    config: {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
    },
  },
  [EXPORT_EXCEL]: {
    url: "/admin/export-excel",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
};

const categories: Record<string, EndpointConfig> = {
  [CATEGORIES]: {
    url: "/categories",
    config: {
      method: "GET",
    },
  },
  [CATEGORIES_DETAILS]: {
    url: "/categories/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [CATEGORIES_TOGGLE_ACTIVE]: {
    url: "/categories/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [CATEGORIES_CREATE]: {
    url: "/categories",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [CATEGORIES_UPDATE]: {
    url: "/categories/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [CATEGORIES_DELETE]: {
    url: "/categories/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const stages: Record<string, EndpointConfig> = {
  [STAGES]: {
    url: "/stages",
    config: {
      method: "GET",
    },
  },
  [STAGES_DETAILS]: {
    url: "/stages/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [STAGES_TOGGLE_ACTIVE]: {
    url: "/stages/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [STAGES_CREATE]: {
    url: "/stages",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [STAGES_UPDATE]: {
    url: "/stages/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [STAGES_DELETE]: {
    url: "/stages/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const batches: Record<string, EndpointConfig> = {
  [BATCHES]: {
    url: "/batches",
    config: {
      method: "GET",
    },
  },
  [BATCHES_DETAILS]: {
    url: "/batches/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [BATCHES_TOGGLE_ACTIVE]: {
    url: "/batches/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [BATCHES_CREATE]: {
    url: "/batches",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [BATCHES_UPDATE]: {
    url: "/batches/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [BATCHES_DELETE]: {
    url: "/batches/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const classes: Record<string, EndpointConfig> = {
  [CLASSES]: {
    url: "/classes",
    config: {
      method: "GET",
    },
  },
  [CLASSES_DETAILS]: {
    url: "/classes/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [CLASSES_MATERIALS]: {
    url: "/classes/{id}/materials",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [CLASSES_TOGGLE_ACTIVE]: {
    url: "/classes/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [CLASSES_CREATE]: {
    url: "/classes",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [CLASSES_UPDATE]: {
    url: "/classes/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [CLASSES_DELETE]: {
    url: "/classes/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
};

const belongUsersClasses: Record<string, EndpointConfig> = {
  [CLASSES_BELONG_USERS]: {
    url: "/classes/{id}/users-in-class",
    config: {
      method: "GET",
    },
  },
  [CLASSES_NOT_BELONG_USERS]: {
    url: "/classes/{id}/users-not-in-class",
    config: {
      method: "GET",
    },
  },
  [CLASSES_WITHOUT_MATERIALS]: {
    url: "/classes/without-material/{id}",
    config: {
      method: "GET",
    },
  },
  [USERS_CLASSES_STATISTICS]: {
    url: "/classes/{id}/users/{userId}/statistics-by-material",
    config: {
      method: "GET",
    },
  },
};

const userClasses: Record<string, EndpointConfig> = {
  [USER_CLASSES]: {
    url: "/user_classes",
    config: {
      method: "GET",
    },
  },
  [USER_CLASSES_DETAILS]: {
    url: "/user_classes/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [USER_CLASSES_TOGGLE_ACTIVE]: {
    url: "/user_classes/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [USER_CLASSES_CREATE]: {
    url: "/user_classes",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [USER_CLASSES_BULK_ASSIGN]: {
    url: "/user_classes/bulk-assign",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [USER_CLASSES_BULK_MOVE]: {
    url: "/user_classes/bulk-move",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [USER_CLASSES_UPDATE]: {
    url: "/user_classes/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [USER_CLASSES_DELETE]: {
    url: "/user_classes/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
  [CLASSES_BELONG_USERS_BULK_DELETE]: {
    url: "/user_classes/bulk-delete",
    config: {
      method: "DELETE",
    },
  },
};

const materials: Record<string, EndpointConfig> = {
  [MATERIALS]: {
    url: "/materials",
    config: {
      method: "GET",
    },
  },
  [MATERIALS_DETAILS]: {
    url: "/materials/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [MATERIALS_TOGGLE_ACTIVE]: {
    url: "/materials/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [MATERIALS_CREATE]: {
    url: "/materials",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [MATERIALS_UPDATE]: {
    url: "/materials/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [MATERIALS_DELETE]: {
    url: "/materials/{id}",
    config: {
      method: "DELETE",
    },
  },
};

const materialDetails: Record<string, EndpointConfig> = {
  [MATERIAL_DETAILS]: {
    url: "/material_details",
    config: {
      method: "GET",
    },
  },
  [MATERIAL_DETAILS_DETAILS]: {
    url: "/material_details/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [MATERIAL_DETAILS_TOGGLE_ACTIVE]: {
    url: "/material_details/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [MATERIAL_DETAILS_CREATE]: {
    url: "/material_details",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [MATERIAL_DETAILS_UPDATE]: {
    url: "/material_details/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [MATERIAL_DETAILS_DELETE]: {
    url: "/material_details/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
  [MATERIAL_DETAILS_CREATE_BULK]: {
    url: "/material_details/bulk",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [MATERIAL_DETAILS_UPDATE_BULK]: {
    url: "/material_details/bulk/update",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
};

const materialSessions: Record<string, EndpointConfig> = {
  [MATERIAL_SESSIONS]: {
    url: "/material_sessions",
    config: {
      method: "GET",
    },
  },
  [MATERIAL_SESSIONS_DETAILS]: {
    url: "/material_sessions/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [MATERIAL_SESSIONS_TOGGLE_ACTIVE]: {
    url: "/material_sessions/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [MATERIAL_SESSIONS_CREATE]: {
    url: "/material_sessions",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [MATERIAL_SESSIONS_UPDATE]: {
    url: "/material_sessions/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [MATERIAL_SESSIONS_DELETE]: {
    url: "/material_sessions/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
  [MATERIAL_SESSIONS_BULK]: {
    url: "/material_sessions/bulk",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [MATERIAL_SESSIONS_BULK_COUNT]: {
    url: "/material_sessions/bulk-count",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [MATERIAL_SESSIONS_REORDER]: {
    url: "/material_sessions/{id1}/replace-sort/{id2}",
    config: {
      method: "PATCH",
    },
  },
  [MATERIAL_SESSIONS_CLASSES]: {
    url: "/material_sessions/classes-by-material-detail/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [MATERIAL_SESSIONS_CLONE]: {
    url: "/material_sessions/clone-to-class",
    config: {
      method: "POST",
      // showToasts: true,
    },
  },
  [MATERIAL_SESSIONS_BULK_DELETE]: {
    url: "/material_sessions/bulk",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
};

const materialContents: Record<string, EndpointConfig> = {
  [MATERIAL_CONTENTS]: {
    url: "/material_contents",
    config: {
      method: "GET",
    },
  },
  [MATERIAL_CONTENTS_DETAILS]: {
    url: "/material_contents/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [MATERIAL_CONTENTS_TOGGLE_ACTIVE]: {
    url: "/material_contents/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [MATERIAL_CONTENTS_CREATE]: {
    url: "/material_contents",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [MATERIAL_CONTENTS_UPDATE]: {
    url: "/material_contents/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [MATERIAL_CONTENTS_DELETE]: {
    url: "/material_contents/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
  [MATERIAL_CONTENTS_REORDER]: {
    url: "/material_contents/{id1}/replace-sort/{id2}",
    config: {
      method: "PATCH",
    },
  },
};

const media: Record<string, EndpointConfig> = {
  [MEDIA_ENTITY_TABLES]: {
    url: "/media/entity-tables",
    config: {
      method: "GET",
    },
  },
  [MEDIA_FOLDER]: {
    url: "/media/folder/{entityType}",
    config: {
      method: "GET",
    },
  },
  [MEDIA_DETAILS]: {
    url: "/media/{id}",
    config: {
      method: "GET",
    },
  },
  [MEDIA_UPLOAD]: {
    url: "/media/upload",
    config: {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      showToasts: true,
    },
  },
  [MEDIA_DELETE]: {
    url: "/media/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
};

const formManagement: Record<string, EndpointConfig> = {
  [FORMS]: {
    url: "/forms",
    config: {
      method: "GET",
    },
  },
  [FORMS_DETAILS]: {
    url: "/forms/{id}/details",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [FORMS_TOGGLE_ACTIVE]: {
    url: "/forms/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [FORMS_CREATE]: {
    url: "/forms",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [FORMS_CREATE_COMPREHENSIVE]: {
    url: "/forms/comprehensive",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [FORMS_UPDATE_COMPREHENSIVE]: {
    url: "/forms/{id}/comprehensive",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [FORMS_DETAILS_COMPREHENSIVE]: {
    url: "/forms/{id}/details",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [FORMS_UPDATE]: {
    url: "/forms/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [FORMS_DELETE]: {
    url: "/forms/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
};

const quizzes: Record<string, EndpointConfig> = {
  [QUIZZES]: {
    url: "/quizzes",
    config: {
      method: "GET",
    },
  },
  [QUIZZES_DETAILS]: {
    url: "/quizzes/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [QUIZZES_TOGGLE_ACTIVE]: {
    url: "/quizzes/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [QUIZZES_CREATE]: {
    url: "/quizzes",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [QUIZZES_CREATE_COMPREHENSIVE]: {
    url: "/quizzes/comprehensive",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [QUIZZES_UPDATE_COMPREHENSIVE]: {
    url: "/quizzes/{id}/comprehensive",
    config: {
      method: "PATCH",
      showToasts: false,
    },
  },
  [QUIZZES_DETAILS_COMPREHENSIVE]: {
    url: "/quizzes/{id}/comprehensive",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [QUIZZES_UPDATE]: {
    url: "/quizzes/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [QUIZZES_DELETE]: {
    url: "/quizzes/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
  [QUIZZES_HEADER_SWAP]: {
    url: "/quiz_headers/swap-sort",
    config: {
      method: "PATCH",
    },
  },
  [QUIZZES_QUESTIONS_SWAP]: {
    url: "/quiz_questions/swap-sort",
    config: {
      method: "PATCH",
    },
  },
  [QUIZZES_OPTIONS_SWAP]: {
    url: "/quiz_question_options/swap-sort",
    config: {
      method: "PATCH",
    },
  },
  [QUIZZES_BY_CLASSID_MATERIALID]: {
    url: "/quizzes/by-class-material/{classId}/{materialId}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [QUIZZES_STUDENTS]: {
    url: "/quizzes/students-results/{sessionId}/{quizId}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [QUIZZES_RESULT_DETAILS]: {
    url: "/quizzes/result-details/{userId}/{sessionId}/{quizId}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [QUIZZES_ASSIGNED_USER]: {
    url: "/quizzes/assigned/{userId}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [QUIZZES_UPDATE_RESULTS_END_DATE]: {
    url: "/quizzes/update-results-end-date",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
};

const videos: Record<string, EndpointConfig> = {
  [VIDEOS]: {
    url: "/videos",
    config: {
      method: "GET",
    },
  },
  [VIDEOS_DETAILS]: {
    url: "/videos/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [VIDEOS_UPLOAD]: {
    url: "/videos/upload",
    config: {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      showToasts: true,
    },
  },
  [VIDEOS_UPLOAD_STORAGE]: {
    url: "/videos/storage/upload",
    config: {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      showToasts: true,
    },
  },
  [VIDEOS_FILE_UPLOAD]: {
    url: "/videos/{id}/upload",
    config: {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      showToasts: true,
    },
  },
  [VIDEOS_DELETE]: {
    url: "/videos/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
  [VIDEOS_URLS]: {
    url: "/videos/{id}/urls",
    config: {
      method: "GET",
    },
  },
  [VIDEOS_EMBED_HTML]: {
    url: "/videos/{id}/embed-html",
    config: {
      method: "GET",
    },
  },
};

const banners: Record<string, EndpointConfig> = {
  [BANNERS]: {
    url: "/banners",
    config: {
      method: "GET",
    },
  },
  [BANNERS_DETAILS]: {
    url: "/banners/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [BANNERS_TOGGLE_ACTIVE]: {
    url: "/banners/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [BANNERS_CREATE]: {
    url: "/banners",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [BANNERS_UPDATE]: {
    url: "/banners/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [BANNERS_DELETE]: {
    url: "/banners/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
};

const userQuizResults: Record<string, EndpointConfig> = {
  [USER_QUIZ_RESULTS]: {
    url: "/user_quiz_results",
    config: {
      method: "GET",
    },
  },
  [USER_QUIZ_RESULTS_DETAILS]: {
    url: "/user_quiz_results/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [USER_QUIZ_RESULTS_CREATE]: {
    url: "/user_quiz_results",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [USER_QUIZ_RESULTS_UPDATE]: {
    url: "/user_quiz_results/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [USER_QUIZ_RESULTS_DELETE]: {
    url: "/user_quiz_results/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
};

const faqs: Record<string, EndpointConfig> = {
  [FAQS]: {
    url: "/faqs",
    config: {
      method: "GET",
    },
  },
  [FAQS_DETAILS]: {
    url: "/faqs/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [FAQS_TOGGLE_ACTIVE]: {
    url: "/faqs/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [FAQS_CREATE]: {
    url: "/faqs",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [FAQS_UPDATE]: {
    url: "/faqs/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [FAQS_DELETE]: {
    url: "/faqs/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
};

const notifications: Record<string, EndpointConfig> = {
  [NOTIFICATIONS]: {
    url: "/notifications",
    config: {
      method: "GET",
    },
  },
  [NOTIFICATIONS_DETAILS]: {
    url: "/notifications/{id}",
    config: {
      method: "GET",
      redirectOnError: true,
    },
  },
  [NOTIFICATIONS_TOGGLE_ACTIVE]: {
    url: "/notifications/{id}/toggle-active",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [NOTIFICATIONS_CREATE]: {
    url: "/notifications",
    config: {
      method: "POST",
      showToasts: true,
    },
  },
  [NOTIFICATIONS_UPDATE]: {
    url: "/notifications/{id}",
    config: {
      method: "PATCH",
      showToasts: true,
    },
  },
  [NOTIFICATIONS_DELETE]: {
    url: "/notifications/{id}",
    config: {
      method: "DELETE",
      showToasts: true,
    },
  },
};

const endpoints: Record<string, EndpointConfig> = {
  ...systemUsersAuth,
  ...users,
  ...students,
  ...instructors,
  ...supervisors,
  ...roles,
  ...permissions,
  ...countries,
  ...cities,
  ...districts,
  ...generalSettings,
  ...profile,
  ...reports,
  ...downloadExcel,
  ...categories,
  ...stages,
  ...batches,
  ...classes,
  ...belongUsersClasses,
  ...userClasses,
  ...materials,
  ...materialDetails,
  ...materialSessions,
  ...materialContents,
  ...media,
  ...formManagement,
  ...quizzes,
  ...videos,
  ...banners,
  ...userQuizResults,
  ...faqs,
  ...notifications,
  ...statistics,
  ...scopes,
};

export default endpoints;

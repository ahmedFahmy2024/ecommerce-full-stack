import { tablesNames } from "./index";

export type CrudRoutes = {
  index: string;
  create: string;
  edit: (id: string) => string;
  view: (id: string) => string;
  clone?: (id: string) => string;
};

const createCrudRoutes = (path: string): CrudRoutes => ({
  index: `/${path}`,
  create: `/${path}/create`,
  edit: (id: string) => `/${path}/edit/${id}`,
  view: (id: string) => `/${path}/view/${id}`,
});

export const routes = {
  // Auth paths here omit the / segment because next-intl Link handles
  // locale prefixing at the app level. The proxy (src/proxy.ts) uses the full
  // /login path to match incoming requests before routing occurs.
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
  },
  dashboard: {
    index: "/dashboard",
    analytics: "/dashboard/analytics",
    reports: "/dashboard/reports",
  },
  denied: {
    index: "/denied",
  },

  // Groups for organization (matching mimic logic)
  userManagement: {
    users: `/${tablesNames.users}`,
    students: `/${tablesNames.students}`,
    instructors: `/${tablesNames.instructors}`,
    supervisors: `/${tablesNames.supervisors}`,
    index: `/${tablesNames.users}`, // Compatibility with existing menus
    create: `/${tablesNames.users}/create`,
    view: (id: string) => `/${tablesNames.users}/view/${id}`,
    edit: (id: string) => `/${tablesNames.users}/edit/${id}`,
    roles: {
      index: `/${tablesNames.roles}`,
      create: `/${tablesNames.roles}/create`,
      edit: (id: string) => `/${tablesNames.roles}/edit/${id}`,
    },
  },

  [tablesNames.users]: createCrudRoutes(tablesNames.users),
  [tablesNames.students]: createCrudRoutes(tablesNames.students),
  [tablesNames.instructors]: createCrudRoutes(tablesNames.instructors),
  [tablesNames.supervisors]: createCrudRoutes(tablesNames.supervisors),
  [tablesNames.roles]: {
    index: `/${tablesNames.roles}`,
    create: `/${tablesNames.roles}/create`,
    edit: (id: string) => `/${tablesNames.roles}/edit/${id}`,
    view: (id: string) => `/${tablesNames.roles}/view/${id}`,
  },
  [tablesNames.permissions]: createCrudRoutes(tablesNames.permissions),

  location: {
    countries: `/${tablesNames.countries}`,
    cities: `/${tablesNames.cities}`,
    districts: `/${tablesNames.districts}`,
  },
  [tablesNames.countries]: createCrudRoutes(tablesNames.countries),
  [tablesNames.cities]: createCrudRoutes(tablesNames.cities),
  [tablesNames.districts]: createCrudRoutes(tablesNames.districts),

  education: {
    categories: `/${tablesNames.categories}`,
    stages: `/${tablesNames.stages}`,
    batches: `/${tablesNames.batches}`,
    classes: `/${tablesNames.classes}`,
    materials: `/${tablesNames.materials}`,
  },
  [tablesNames.categories]: createCrudRoutes(tablesNames.categories),
  [tablesNames.stages]: createCrudRoutes(tablesNames.stages),
  [tablesNames.batches]: createCrudRoutes(tablesNames.batches),
  [tablesNames.classes]: createCrudRoutes(tablesNames.classes),
  [tablesNames.materials]: createCrudRoutes(tablesNames.materials),

  learning: {
    quizzes: `/${tablesNames.quizzes}`,
    forms: `/${tablesNames.forms}`,
    banners: `/${tablesNames.banners}`,
    contents: `/${tablesNames.contents}`,
  },
  [tablesNames.quizzes]: {
    ...createCrudRoutes(tablesNames.quizzes),
    clone: (id: string) => `/${tablesNames.quizzes}/clone/${id}`,
  },
  [tablesNames.forms]: createCrudRoutes(tablesNames.forms),
  [tablesNames.banners]: createCrudRoutes(tablesNames.banners),
  [tablesNames.contents]: createCrudRoutes(tablesNames.contents),

  settings: {
    index: `/${tablesNames.general_settings}`, // Alias for compatibility
    general_settings: `/${tablesNames.general_settings}`,
    profile: `/${tablesNames.profile}`,
    notifications: `/${tablesNames.notifications}`,
    security: "/security",
    appearance: "/appearance",
  },
  [tablesNames.general_settings]: createCrudRoutes(
    tablesNames.general_settings,
  ),
  [tablesNames.profile]: {
    index: `/${tablesNames.profile}`,
    create: `/${tablesNames.profile}/create`,
    edit: (id: string) => `/${tablesNames.profile}/edit/${id}`,
    view: (id: string) => `/${tablesNames.profile}/view/${id}`,
  },
  [tablesNames.notifications]: createCrudRoutes(tablesNames.notifications),

  auditLogs: {
    index: "/audit-logs",
  },

  statistics: {
    index: `/${tablesNames.statistics}`,
  },
} as const;

export type AppRoutes = typeof routes;

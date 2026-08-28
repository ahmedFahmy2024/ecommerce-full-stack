/**
 * tableNames constant object acts as the unique identifier for every data entity in the app.
 * Used in API queries, i18n, and routes.
 */
export const tablesNames = {
  students: "students",
  instructors: "instructors",
  supervisors: "supervisors",
  users: "users",
  roles: "roles",
  permissions: "permissions",
  profile: "profile",
  countries: "countries",
  cities: "cities",
  districts: "districts",
  general_settings: "general-settings",
  notifications: "notifications",
  categories: "categories",
  stages: "stages",
  batches: "batches",
  classes: "classes",
  belongUsersClasses: "belong-users-classes",
  userClasses: "user-classes",
  materials: "materials",
  materialDetails: "material-details",
  materialSessions: "material-sessions",
  materialContents: "material-contents",
  forms: "forms",
  quizzes: "quizzes",
  quizzesResults: "quizzes-results",
  contents: "contents",
  banners: "banners",
  certificates: "certificates",
  diplomas: "diplomas",
  digitalProducts: "digital-products",
  coupons: "coupons",
  subscriptions: "subscriptions",
  list: "list",
  articles: "articles",
  faqs: "faqs",
  aboutUs: "about-us",
  contactUs: "contact-us",
  terms: "terms",
  privacyPolicy: "privacy-policy",
  sections: "sections",
  material: "material",
  userQuizResults: "user-quiz-results",
  statistics: "statistics",
} as const;

export type TableName = keyof typeof tablesNames;

export const LOCALE_COOKIE = "inox";

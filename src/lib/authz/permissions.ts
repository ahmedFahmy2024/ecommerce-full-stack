/**
 * Single source of truth for every permission string the app references.
 *
 * Adding a permission the UI cares about:
 *   1. Add it under the appropriate resource here.
 *   2. Use it via `PERMISSION.RESOURCE.ACTION` everywhere — never the raw string.
 *
 * The backend may have more permissions than appear here. Those still flow
 * through the role editor (which fetches them live); they just aren't
 * referenced in static checks.
 */
export const PERMISSION = {
  USER: {
    LIST: "LIST_USER",
    VIEW: "VIEW_USER",
    CREATE: "CREATE_USER",
    UPDATE: "UPDATE_USER",
    DELETE: "DELETE_USER",
  },
  ROLE: {
    LIST: "LIST_ROLE",
    VIEW: "VIEW_ROLE",
    CREATE: "CREATE_ROLE",
    UPDATE: "UPDATE_ROLE",
    DELETE: "DELETE_ROLE",
  },
  PERMISSION_ENTITY: {
    LIST: "LIST_PERMISSION",
    VIEW: "VIEW_PERMISSION",
    CREATE: "CREATE_PERMISSION",
    UPDATE: "UPDATE_PERMISSION",
    DELETE: "DELETE_PERMISSION",
  },
  COUNTRY: {
    LIST: "LIST_COUNTRY",
    VIEW: "VIEW_COUNTRY",
    CREATE: "CREATE_COUNTRY",
    UPDATE: "UPDATE_COUNTRY",
    DELETE: "DELETE_COUNTRY",
  },
  CITY: {
    LIST: "LIST_CITY",
    VIEW: "VIEW_CITY",
    CREATE: "CREATE_CITY",
    UPDATE: "UPDATE_CITY",
    DELETE: "DELETE_CITY",
  },
  DISTRICT: {
    LIST: "LIST_DISTRICT",
    VIEW: "VIEW_DISTRICT",
    CREATE: "CREATE_DISTRICT",
    UPDATE: "UPDATE_DISTRICT",
    DELETE: "DELETE_DISTRICT",
  },
  CATEGORY: {
    LIST: "LIST_CATEGORY",
    VIEW: "VIEW_CATEGORY",
    CREATE: "CREATE_CATEGORY",
    UPDATE: "UPDATE_CATEGORY",
    DELETE: "DELETE_CATEGORY",
  },
  STAGE: {
    LIST: "LIST_STAGE",
    VIEW: "VIEW_STAGE",
    CREATE: "CREATE_STAGE",
    UPDATE: "UPDATE_STAGE",
    DELETE: "DELETE_STAGE",
  },
  BATCH: {
    LIST: "LIST_BATCH",
    VIEW: "VIEW_BATCH",
    CREATE: "CREATE_BATCH",
    UPDATE: "UPDATE_BATCH",
    DELETE: "DELETE_BATCH",
  },
  CLASS: {
    LIST: "LIST_CLASS",
    VIEW: "VIEW_CLASS",
    CREATE: "CREATE_CLASS",
    UPDATE: "UPDATE_CLASS",
    DELETE: "DELETE_CLASS",
  },
  MATERIAL: {
    LIST: "LIST_MATERIAL",
    VIEW: "VIEW_MATERIAL",
    CREATE: "CREATE_MATERIAL",
    UPDATE: "UPDATE_MATERIAL",
    DELETE: "DELETE_MATERIAL",
  },
  BANNER: {
    LIST: "LIST_BANNER",
    VIEW: "VIEW_BANNER",
    CREATE: "CREATE_BANNER",
    UPDATE: "UPDATE_BANNER",
    DELETE: "DELETE_BANNER",
  },
  FORM: {
    LIST: "LIST_FORM",
    VIEW: "VIEW_FORM",
    CREATE: "CREATE_FORM",
    UPDATE: "UPDATE_FORM",
    DELETE: "DELETE_FORM",
  },
  QUIZ: {
    LIST: "LIST_QUIZZ",
    VIEW: "VIEW_QUIZZ",
    CREATE: "CREATE_QUIZZ",
    UPDATE: "UPDATE_QUIZZ",
    DELETE: "DELETE_QUIZZ",
  },
  NOTIFICATION: {
    LIST: "LIST_NOTIFICATION",
    VIEW: "VIEW_USER_SESSION_BLOCK", // placeholder; adjust if backend exposes VIEW
    CREATE: "CREATE_NOTIFICATION",
    UPDATE: "UPDATE_NOTIFICATION",
    DELETE: "DELETE_NOTIFICATION",
  },
  GENERAL_SETTING: {
    LIST: "LIST_GENERAL_SETTING",
    VIEW: "VIEW_GENERAL_SETTING",
    CREATE: "CREATE_GENERAL_SETTING",
    UPDATE: "UPDATE_GENERAL_SETTING",
    DELETE: "DELETE_GENERAL_SETTING",
  },
} as const;

type ResourceKey = keyof typeof PERMISSION;
type ActionKey<R extends ResourceKey> = keyof (typeof PERMISSION)[R];

/**
 * Union of every permission string declared above. Use this as the
 * parameter type for any check helper so unknown strings become a
 * compile error.
 */
export type Permission = {
  [R in ResourceKey]: (typeof PERMISSION)[R][ActionKey<R>];
}[ResourceKey];

/**
 * Permission bundle for a standard CRUD resource. Consumers pass one of
 * these to `resolveCrudActions` to convert a permission set into a
 * `TableActionsConfig`.
 */
export interface CrudPermissions {
  list: Permission;
  view?: Permission;
  create: Permission;
  update: Permission;
  delete: Permission;
}

/** Frozen CRUD bundles for every resource that has a standard CRUD page. */
export const CRUD: Record<string, CrudPermissions> = {
  USER: {
    list: PERMISSION.USER.LIST,
    view: PERMISSION.USER.VIEW,
    create: PERMISSION.USER.CREATE,
    update: PERMISSION.USER.UPDATE,
    delete: PERMISSION.USER.DELETE,
  },
  ROLE: {
    list: PERMISSION.ROLE.LIST,
    view: PERMISSION.ROLE.VIEW,
    create: PERMISSION.ROLE.CREATE,
    update: PERMISSION.ROLE.UPDATE,
    delete: PERMISSION.ROLE.DELETE,
  },
  PERMISSION_ENTITY: {
    list: PERMISSION.PERMISSION_ENTITY.LIST,
    view: PERMISSION.PERMISSION_ENTITY.VIEW,
    create: PERMISSION.PERMISSION_ENTITY.CREATE,
    update: PERMISSION.PERMISSION_ENTITY.UPDATE,
    delete: PERMISSION.PERMISSION_ENTITY.DELETE,
  },
  COUNTRY: {
    list: PERMISSION.COUNTRY.LIST,
    view: PERMISSION.COUNTRY.VIEW,
    create: PERMISSION.COUNTRY.CREATE,
    update: PERMISSION.COUNTRY.UPDATE,
    delete: PERMISSION.COUNTRY.DELETE,
  },
  CITY: {
    list: PERMISSION.CITY.LIST,
    view: PERMISSION.CITY.VIEW,
    create: PERMISSION.CITY.CREATE,
    update: PERMISSION.CITY.UPDATE,
    delete: PERMISSION.CITY.DELETE,
  },
  DISTRICT: {
    list: PERMISSION.DISTRICT.LIST,
    view: PERMISSION.DISTRICT.VIEW,
    create: PERMISSION.DISTRICT.CREATE,
    update: PERMISSION.DISTRICT.UPDATE,
    delete: PERMISSION.DISTRICT.DELETE,
  },
  CATEGORY: {
    list: PERMISSION.CATEGORY.LIST,
    view: PERMISSION.CATEGORY.VIEW,
    create: PERMISSION.CATEGORY.CREATE,
    update: PERMISSION.CATEGORY.UPDATE,
    delete: PERMISSION.CATEGORY.DELETE,
  },
  STAGE: {
    list: PERMISSION.STAGE.LIST,
    view: PERMISSION.STAGE.VIEW,
    create: PERMISSION.STAGE.CREATE,
    update: PERMISSION.STAGE.UPDATE,
    delete: PERMISSION.STAGE.DELETE,
  },
  BATCH: {
    list: PERMISSION.BATCH.LIST,
    view: PERMISSION.BATCH.VIEW,
    create: PERMISSION.BATCH.CREATE,
    update: PERMISSION.BATCH.UPDATE,
    delete: PERMISSION.BATCH.DELETE,
  },
  CLASS: {
    list: PERMISSION.CLASS.LIST,
    view: PERMISSION.CLASS.VIEW,
    create: PERMISSION.CLASS.CREATE,
    update: PERMISSION.CLASS.UPDATE,
    delete: PERMISSION.CLASS.DELETE,
  },
  MATERIAL: {
    list: PERMISSION.MATERIAL.LIST,
    view: PERMISSION.MATERIAL.VIEW,
    create: PERMISSION.MATERIAL.CREATE,
    update: PERMISSION.MATERIAL.UPDATE,
    delete: PERMISSION.MATERIAL.DELETE,
  },
  BANNER: {
    list: PERMISSION.BANNER.LIST,
    view: PERMISSION.BANNER.VIEW,
    create: PERMISSION.BANNER.CREATE,
    update: PERMISSION.BANNER.UPDATE,
    delete: PERMISSION.BANNER.DELETE,
  },
  FORM: {
    list: PERMISSION.FORM.LIST,
    view: PERMISSION.FORM.VIEW,
    create: PERMISSION.FORM.CREATE,
    update: PERMISSION.FORM.UPDATE,
    delete: PERMISSION.FORM.DELETE,
  },
  QUIZ: {
    list: PERMISSION.QUIZ.LIST,
    view: PERMISSION.QUIZ.VIEW,
    create: PERMISSION.QUIZ.CREATE,
    update: PERMISSION.QUIZ.UPDATE,
    delete: PERMISSION.QUIZ.DELETE,
  },
} as const;

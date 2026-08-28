export type ApiResponse<T = unknown> = {
  statusCode?: number;
  message: string;
  data: T;
};

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationLinks {
  first: string;
  previous: string;
  next: string;
  last: string;
  current: string;
}

export interface Facets {
  languages: { value: string; count: number }[];
  tiers: { value: string; count: number }[];
  priceRange: { min: number; max: number };
  ratings: { value: number; count: number }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
  facets?: Facets;
  maxSalePrice?: number;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type CrudOperation =
  | "get"
  | "create"
  | "update"
  | "delete"
  | "deleteMany"
  | "details"
  | "download"
  | "import"
  | "export";

export interface EndpointConfig {
  url: string;
  config?: {
    method: HttpMethod;
    headers?: Record<string, string>;
    cache?: RequestCache;
    redirectOnError?: boolean;
    throwError?: boolean;
    showToasts?: boolean;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    propagateServerError?: boolean;
  };
}
/** Error item from API validation error arrays */
export interface ErrorItem {
  property: string;
  messages: string[];
}

/** Standardized error response after normalization */
export interface ErrorResponse {
  message: string;
  errors: Record<string, string>;
}

export interface ApiConfigOptions<TResponse = unknown, TBody = unknown> {
  params?: Record<string, string | number>;
  query?: Record<string, string | string[] | number | number[] | boolean>;
  /**
   * Not sent to the API. Include values here that must appear in the TanStack Query
   * cache key (e.g. a filter that affects what data is fetched but is not a query param).
   */
  customQuery?: Record<string, string | string[] | number | number[] | boolean>;
  body?: TBody;
  signal?: AbortSignal;
  accessToken?: string;
  onSuccess?: (data: ApiResponse<TResponse>) => void;
  onError?: (error: ApiError) => void;
  next?: {
    tags?: string[];
    revalidate?: number | false;
  };
}

/**
 * Represents the standardized API error structure used across the application.
 */
export interface ApiError {
  /** HTTP status code of the error */
  status?: number;

  /** Main error message */
  message: string;

  /** Response object containing detailed error information */
  response?: {
    /** Response data */
    data: {
      /** Detailed field-level errors mapped by field name */
      errors: Record<string, string>;

      /** Main error message (duplicated from the top level) */
      message: string;

      /** HTTP status code (duplicated from the top level) */
      status?: number;
    };
  };
}

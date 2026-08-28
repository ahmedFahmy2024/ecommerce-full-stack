import { inspect } from "util";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import type { ApiConfigOptions, ApiError, ApiResponse } from "@/types/api";
import endpoints from "./endpoints";
import { isServer } from "./environment";
import { getErrorMessage } from "./extract-errors";
import { getLanguageAndToken } from "./getLanguageAndToken";

const pp = (data: unknown) => inspect(data, { depth: null, colors: true });

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const apiClient = async <TResponse = unknown, TBody = unknown>(
  endpointName: string,
  options: ApiConfigOptions<TResponse, TBody> = {},
  dynamicEndpoint?: string,
): Promise<ApiResponse<TResponse>> => {
  const isServerSide = isServer();
  const { params, query, body, onSuccess, onError, next, signal } = options;
  const { lang, token } = await getLanguageAndToken();
  const endpoint = endpoints[endpointName];
  if (!endpoint && !dynamicEndpoint) {
    throw new Error(`Endpoint ${endpointName} not found`);
  }
  let { url } = endpoint;
  const propagateServerError = endpoint?.config?.propagateServerError ?? true;

  // Replace URL params
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, String(value));
    });
  }

  // Add query parameters
  if (query) {
    const queryString = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const val of value) {
          if (val === "") continue;
          queryString.append(key, String(val));
        }
      } else {
        if (value === "") continue;
        queryString.append(key, String(value));
      }
    }

    const qs = queryString.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Access-Api": process.env.NEXT_PUBLIC_API_KEY || "",
    lang,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const headers = { ...defaultHeaders, ...endpoint.config?.headers };

  const fetchInit: RequestInit = {
    ...endpoint.config,
    headers,
    next,
    signal,
  };

  if (body) {
    if (headers["Content-Type"] === "application/json") {
      fetchInit.body = JSON.stringify(body);
    } else if (headers["Content-Type"] === "multipart/form-data") {
      delete headers["Content-Type"]; // Let the browser set it

      const formData = new FormData();

      Object.entries(body as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (typeof value === "object" && value !== null) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        },
      );

      fetchInit.body = formData as BodyInit;
    }
  }

  const fullUrl = dynamicEndpoint ? dynamicEndpoint : `${BASE_URL}${url}`;

  if (isServerSide) {
    console.log("[API]", fetchInit.method || "GET", fullUrl);
    if (fetchInit.body) {
      try {
        // console.log("[API] Body:", pp(JSON.parse(fetchInit.body as string)));
      } catch {
        // console.log("[API] Body:", fetchInit.body);
      }
    }
  }

  try {
    const response = await fetch(fullUrl, fetchInit);

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      let err: unknown;

      if (contentType.includes("application/json")) {
        err = await response.json();
      } else {
        const text = await response.text();
        console.error(
          "apiClient non-JSON error response:",
          response.status,
          text.slice(0, 500),
        );
        err = {
          status: response.status,
          message: `Server error (${response.status})`,
        };
      }

      const errObj = err as { status?: number; message?: unknown };
      if (isServerSide) {
        // console.log("[API] Error response:", response.status, pp(err));
      }
      const { message, errors } = getErrorMessage(errObj?.message);

      const error: ApiError = {
        status: errObj.status,
        message,
        response: {
          data: {
            errors,
            message,
            status: errObj.status,
          },
        },
      };

      throw error;
    }
    const data: ApiResponse<TResponse> = await response.json();
    if (isServerSide) {
      // console.log("[API] Response:", response.status, pp(data));
    }
    if (
      (endpoint.config?.showToasts || endpoint.config?.showSuccessToast) &&
      !isServerSide
    ) {
      toast.success(data.message || "Operation done successfully");
    }
    onSuccess?.(data);
    return data;
  } catch (error: unknown) {
    const apiError = error as ApiError;

    if (!isServerSide) {
      if (endpoint.config?.showToasts || endpoint.config?.showErrorToast) {
        toast.error(apiError.message);
      }
      if (
        endpoint.config?.redirectOnError &&
        apiError?.response?.data?.status === 404
      ) {
        notFound();
      }
      onError?.(apiError);
    } else {
      if (
        endpoint.config?.redirectOnError &&
        apiError?.response?.data?.status === 404
      ) {
        notFound();
      }
      if (propagateServerError) throw error;
    }
    if (endpoint.config?.throwError) {
      throw error;
    }
    return apiError?.response?.data as unknown as ApiResponse<TResponse>;
  }
};

export default apiClient;

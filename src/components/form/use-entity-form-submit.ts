"use client";

import apiClient from "@/services/api";

interface UseEntityFormSubmitOptions<TValues, TEntity, TBody = TValues> {
  entity?: TEntity;
  createEndpoint: string;
  updateEndpoint: string;
  getId: (entity: TEntity) => string;
  transform?: (values: TValues) => TBody;
  onSuccess?: () => void;
}

export function useEntityFormSubmit<TValues, TEntity, TBody = TValues>({
  entity,
  createEndpoint,
  updateEndpoint,
  getId,
  transform,
  onSuccess,
}: UseEntityFormSubmitOptions<TValues, TEntity, TBody>) {
  return async function onSubmit(values: TValues) {
    const body = (transform ? transform(values) : values) as TBody;
    if (entity) {
      await apiClient<unknown, TBody>(updateEndpoint, {
        params: { id: getId(entity) },
        body,
        onSuccess: () => onSuccess?.(),
      });
    } else {
      await apiClient<unknown, TBody>(createEndpoint, {
        body,
        onSuccess: () => onSuccess?.(),
      });
    }
  };
}

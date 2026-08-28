"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type * as React from "react";
import { getQueryClient } from "@/lib/get-query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that uses it.
  // Otherwise, React will re-initialize the client on every render if it suspends.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

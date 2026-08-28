"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Source: next/dist/docs/03-file-conventions/error.md — log to reporting service
    // Do not expose raw error.message to UI for ApiClientError (may contain backend details)
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

"use client";

import { AlertCircle } from "lucide-react";

export default function UsersError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <AlertCircle className="size-10 text-destructive" />
      <p className="text-muted-foreground text-sm">
        Something went wrong loading users.
      </p>
      <button
        type="button"
        onClick={reset}
        className="text-primary underline-offset-4 hover:underline text-sm"
      >
        Try again
      </button>
    </div>
  );
}

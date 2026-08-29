import { Clock } from "lucide-react";

interface RoutePlaceholderProps {
  title: string;
  description: string;
  /** The TASK.md task that delivers the vertical slice for this route. */
  task: string;
}

/**
 * Shared placeholder for shell routes whose vertical slice ships in a later
 * Milestone 3 task (T30+). Server component — no `"use client"`.
 *
 * Deliberately NOT a static mock of the future feature: per the integration
 * plan (Phase 3), every domain is built vertically only once its backend
 * contract is wired. This placeholder exists so the T22 navigation entries
 * resolve to real routes (Done criterion: "no links to unimplemented
 * routes") while staying honest about what is not built yet.
 */
export function RoutePlaceholder({
  title,
  description,
  task,
}: RoutePlaceholderProps) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-lg border bg-muted/40 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          Not yet implemented — planned in {task}
        </p>
        <p className="mt-2 text-muted-foreground">
          This route is part of the e-commerce shell (T22). Its vertical slice
          (typed service, query hooks, screens, and states) lands with {task}.
          Backend authorization (<code>@Auth()</code>) remains authoritative for
          this area.
        </p>
      </div>
    </section>
  );
}

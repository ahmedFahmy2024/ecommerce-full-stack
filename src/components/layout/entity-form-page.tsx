import type { ReactNode } from "react";

import { PageHeader } from "./page-header";

interface EntityFormPageProps {
  title: string;
  description?: string;
  /** Right-aligned slot in the header. */
  actions?: ReactNode;
  children: ReactNode;
}

export function EntityFormPage({
  title,
  description,
  actions,
  children,
}: EntityFormPageProps) {
  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeader title={title} description={description}>
        {actions}
      </PageHeader>
      {children}
    </div>
  );
}

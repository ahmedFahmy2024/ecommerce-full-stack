import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      <DataTableSkeleton
        columnCount={9}
        rowCount={10}
        filterCount={3}
        withViewOptions
        withPagination
      />
    </div>
  );
}

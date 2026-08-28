export default function DashboardLoading() {
  return (
    <div
      className="flex h-full flex-1 items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

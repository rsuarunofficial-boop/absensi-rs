export function DataLoading() {
  return (
    <div
      aria-label="Memuat data"
      className="space-y-4"
      role="status"
    >
      <div className="h-28 animate-pulse rounded-[26px] bg-slate-200" />
      <div className="h-36 animate-pulse rounded-[26px] bg-slate-200" />
      <span className="sr-only">Memuat data...</span>
    </div>
  );
}

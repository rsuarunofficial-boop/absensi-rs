import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminReport } from "@/components/admin/admin-report";
import { DataLoading } from "@/components/data-loading";
import { getAdminReport } from "@/lib/admin/report-data";

export const metadata: Metadata = {
  title: "Laporan Presensi",
};

type ReportSearchParams = Promise<{
  from?: string;
  to?: string;
  unit?: string;
}>;

async function AdminReportContent({
  searchParams,
}: {
  searchParams: ReportSearchParams;
}) {
  const params = await searchParams;
  const result = await getAdminReport({
    from: params.from,
    to: params.to,
    unitId: params.unit,
  });
  return <AdminReport result={result} />;
}

export default function AdminReportPage({
  searchParams,
}: {
  searchParams: ReportSearchParams;
}) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              RS Arun Lhokseumawe
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Laporan Presensi</h1>
            <p className="mt-1 text-sm text-slate-300">
              Rekap dan rincian presensi per unit kerja.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
              href="/admin/data"
            >
              Kelola data
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
              href="/admin"
            >
              Dashboard admin
            </Link>
          </div>
        </header>
        <Suspense fallback={<DataLoading />}>
          <AdminReportContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

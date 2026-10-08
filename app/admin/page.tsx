import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { DataLoading } from "@/components/data-loading";

export const metadata: Metadata = {
  title: "Dashboard Admin",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              RS Arun Lhokseumawe
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Dashboard Admin
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Ringkasan kehadiran dan data karyawan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-400"
              href="/admin/laporan"
            >
              Laporan presensi
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-400"
              href="/admin/data"
            >
              Kelola data
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
              href="/"
            >
              Buka aplikasi karyawan
            </Link>
          </div>
        </header>

        <Suspense fallback={<DataLoading />}>
          <AdminDashboard />
        </Suspense>
      </div>
    </main>
  );
}

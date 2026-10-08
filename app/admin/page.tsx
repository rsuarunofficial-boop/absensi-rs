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
    <main className="min-h-screen bg-[#f2f6fc] text-slate-800 lg:flex">
      <aside className="flex w-full shrink-0 flex-col bg-[#102d50] text-white lg:min-h-screen lg:w-64">
        <Link
          className="flex min-h-20 items-center gap-3 border-b border-white/10 px-5"
          href="/admin"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl font-black text-[#0878df]">
            +
          </span>
          <span>
            <span className="block text-lg font-bold leading-5">RS ARUN</span>
            <span className="text-[10px] font-semibold tracking-[0.18em] text-blue-200">
              LHOKSEUMAWE
            </span>
          </span>
        </Link>
        <nav aria-label="Navigasi admin" className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible">
          <Link
            aria-current="page"
            className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20"
            href="/admin"
          >
            <span aria-hidden="true">▦</span> Dashboard
          </Link>
          <Link
            className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
            href="/admin/data"
          >
            <span aria-hidden="true">♙</span> Data Karyawan
          </Link>
          <Link
            className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
            href="/admin/laporan"
          >
            <span aria-hidden="true">▤</span> Laporan Presensi
          </Link>
          <Link
            className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white lg:mt-auto"
            href="/"
          >
            <span aria-hidden="true">←</span> Aplikasi Karyawan
          </Link>
        </nav>
        <div className="hidden border-t border-white/10 px-5 py-5 text-xs leading-5 text-blue-200 lg:block">
          <p className="font-semibold text-white">RS Arun Lhokseumawe</p>
          <p>Melayani dengan hati untuk kesehatan Anda.</p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7">
          <p className="text-sm font-medium text-slate-500">Panel administrator</p>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              A
            </span>
            <span className="hidden text-sm sm:block">
              <span className="block font-semibold text-slate-800">Admin</span>
              <span className="text-xs text-slate-500">Administrator</span>
            </span>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5 sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#102d50] sm:text-3xl">
                Dashboard Absensi Karyawan
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Rumah Sakit Arun Lhokseumawe
              </p>
            </div>
            <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
              Data diperbarui untuk hari ini
            </p>
          </div>
          <Suspense fallback={<DataLoading />}>
            <AdminDashboard />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

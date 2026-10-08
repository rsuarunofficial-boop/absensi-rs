import { Suspense } from "react";
import { LiveClock } from "@/components/attendance/live-clock";
import { AppShell } from "@/components/app-shell";
import { PwaStatus } from "@/components/pwa/pwa-status";
import { EmployeeDashboardData } from "@/components/attendance/employee-dashboard-data";
import { DataLoading } from "@/components/data-loading";

export default function HomePage() {
  return (
    <AppShell activePage="beranda">
      <div className="-mx-4 -mt-5 space-y-4 pb-3">
        <header className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-[#087acb] via-[#0764ad] to-[#103e73] px-5 pb-8 pt-6 text-white shadow-lg shadow-blue-900/15">
          <div
            aria-hidden="true"
            className="absolute -right-7 -top-9 h-44 w-44 rounded-full border-[22px] border-white/5"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-14 right-16 h-36 w-36 rounded-full bg-sky-300/10 blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white text-2xl font-black text-blue-600 shadow-sm">
                +
              </span>
              <div className="min-w-0">
                <h1 className="text-lg font-extrabold leading-5 tracking-wide">
                  RS ARUN
                </h1>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-blue-100">
                  LHOKSEUMAWE
                </p>
                <p className="mt-1 hidden text-[10px] leading-3 text-blue-100 sm:block">
                  Melayani dengan hati untuk kesehatan Anda
                </p>
              </div>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
              <p className="text-[9px] font-medium uppercase tracking-wide text-blue-100">
                Waktu Aceh
              </p>
              <LiveClock />
            </div>
          </div>
        </header>

        <div className="space-y-4 px-4">
          <Suspense fallback={<DataLoading />}>
            <EmployeeDashboardData />
          </Suspense>

          <PwaStatus />
        </div>
      </div>
    </AppShell>
  );
}

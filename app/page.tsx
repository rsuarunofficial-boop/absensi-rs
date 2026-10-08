import { Suspense } from "react";
import { LiveClock } from "@/components/attendance/live-clock";
import { AppShell } from "@/components/app-shell";
import { PwaStatus } from "@/components/pwa/pwa-status";
import { EmployeeDashboardData } from "@/components/attendance/employee-dashboard-data";
import { DataLoading } from "@/components/data-loading";

export default function HomePage() {
  return (
    <AppShell activePage="beranda">
      <div className="space-y-5">
        <section className="rounded-[28px] bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-5 text-white shadow-lg shadow-emerald-900/15">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            RS Arun Lhokseumawe
          </p>
          <h1 className="mt-2 text-2xl font-bold">Portal Karyawan</h1>
          <p className="mt-1 text-sm text-emerald-100">
            Informasi presensi dan aktivitas kerja Anda.
          </p>
          <div className="mt-5 flex items-end justify-between rounded-2xl border border-white/15 bg-white/10 p-4">
            <div>
              <p className="text-sm text-emerald-100">Waktu saat ini</p>
              <LiveClock />
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              Waktu Aceh (WIB)
            </span>
          </div>
        </section>

        <Suspense fallback={<DataLoading />}>
          <EmployeeDashboardData />
        </Suspense>

        <PwaStatus />
      </div>
    </AppShell>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataLoading } from "@/components/data-loading";
import { getAttendanceHistory } from "@/lib/attendance/data";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const statusLabels = {
  hadir: "Hadir",
  terlambat: "Terlambat",
  izin: "Izin",
  sakit: "Sakit",
  cuti: "Cuti",
} as const;

export default function RiwayatPage() {
  return (
    <AppShell activePage="riwayat">
      <Suspense fallback={<DataLoading />}>
        <AttendanceHistory />
      </Suspense>
    </AppShell>
  );
}

async function AttendanceHistory() {
  const historyResult = await getAttendanceHistory();
  const records = historyResult.data;

  return (
    <div className="space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Presensi
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Riwayat kehadiran
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Catatan kehadiran pribadi yang tercatat untuk akun Anda.
          </p>
        </header>

        {historyResult.error ? (
          <section
            className="rounded-[26px] bg-rose-50 p-5 text-sm leading-6 text-rose-800"
            role="alert"
          >
            {historyResult.error} Pastikan migrasi database sudah dijalankan.
          </section>
        ) : records?.length ? (
          <section className="space-y-3">
            {records.map((record) => (
              <article
                key={record.id}
                className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {dateFormatter.format(
                        new Date(`${record.work_date}T12:00:00+07:00`)
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {statusLabels[record.status]}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Tercatat
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Masuk</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {timeFormatter.format(new Date(record.check_in_at))} WIB
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Keluar</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {record.check_out_at
                        ? `${timeFormatter.format(new Date(record.check_out_at))} WIB`
                        : "Belum check-out"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-[26px] border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Belum ada data presensi
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-600">
              Riwayat akan tampil setelah catatan presensi dimasukkan ke sistem.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              href="/"
            >
              Kembali ke beranda
            </Link>
          </section>
        )}
    </div>
  );
}

import Link from "next/link";
import {
  getAttendanceHistory,
  getEmployeeGroupSchedules,
  getEmployeeProfile,
  getTodayAttendance,
  type AttendanceRecord,
} from "@/lib/attendance/data";
import { AttendanceCard } from "@/components/attendance/attendance-card";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const statusLabels: Record<AttendanceRecord["status"], string> = {
  hadir: "Hadir",
  terlambat: "Terlambat",
  izin: "Izin",
  sakit: "Sakit",
  cuti: "Cuti",
};

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00+07:00`));
}

function formatTime(value: string | null) {
  return value ? `${timeFormatter.format(new Date(value))} WIB` : "Belum tercatat";
}

export async function EmployeeDashboardData() {
  const [profileResult, attendanceResult, historyResult] = await Promise.all([
    getEmployeeProfile(),
    getTodayAttendance(),
    getAttendanceHistory(),
  ]);
  const profile = profileResult.data;
  const scheduleResult =
    profile?.employee_status === "shift" && profile.schedule_group_id
      ? await getEmployeeGroupSchedules(profile.schedule_group_id)
      : profile?.employee_status === "shift"
        ? {
            data: null,
            error: "Grup jadwal belum diatur pada profil Anda.",
          }
        : { data: [], error: null };
  const attendance = attendanceResult.data;
  const selectedSchedule = attendance?.schedule_id
    ? scheduleResult.data?.find(
        (schedule) => schedule.id === attendance.schedule_id
      )
    : null;
  const scheduleLabel = selectedSchedule
    ? `${selectedSchedule.name} · ${selectedSchedule.start_time.slice(0, 5)}–${selectedSchedule.end_time.slice(0, 5)}`
    : profile?.employee_status === "shift"
      ? profile.shift_name ?? "Shift"
      : "Harian";
  const currentStatus = attendance
    ? statusLabels[attendance.status]
    : "Belum absen";
  const recentRecords = historyResult.data?.slice(0, 4) ?? [];

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-sky-50 text-blue-700"
          >
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 48 48"
            >
              <circle cx="24" cy="17" r="10" fill="currentColor" opacity=".25" />
              <path
                d="M7 44c1.8-9.3 7.4-14 17-14s15.2 4.7 17 14"
                fill="currentColor"
                opacity=".25"
              />
              <path
                d="M16 17a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm-6 27c1.2-7 5.9-11 14-11s12.8 4 14 11"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <path
                d="m20 31 4 5 4-5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-500">
              Selamat datang,
            </p>
            <h2 className="truncate text-lg font-bold leading-6 text-[#123a68]">
              {profile?.full_name ?? "Karyawan"}
            </h2>
            <p className="truncate text-[10px] text-slate-500">
              {profile
                ? [
                    profile.position ?? "Karyawan",
                    profile.employee_number
                      ? `NIP. ${profile.employee_number}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" | ")
                : profileResult.error ?? "Profil belum tersedia"}
            </p>
          </div>
        </div>
        {profileResult.error ? (
          <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-800" role="alert">
            {profileResult.error} Pastikan migrasi database sudah dijalankan.
          </p>
        ) : !profile ? (
          <p className="mt-3 text-xs leading-5 text-amber-800">
            Akun login aktif, tetapi profil pegawai belum dibuat. Hubungi administrator.
          </p>
        ) : null}
      </section>

      <AttendanceCard
        attendance={attendance}
        error={attendanceResult.error}
        canAttend={profile?.role === "karyawan" && !profileResult.error}
        employeeStatus={profile?.employee_status ?? null}
        schedules={scheduleResult.data}
        scheduleError={scheduleResult.error}
      />

      <section aria-label="Ringkasan presensi hari ini" className="grid grid-cols-2 gap-2.5">
        <article className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-3">
          <p className="text-[10px] font-semibold text-emerald-800">Status hari ini</p>
          <p className="mt-1 truncate text-sm font-bold text-emerald-950">
            {currentStatus}
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-700">
            {attendance ? formatDate(attendance.work_date) : "Belum ada catatan"}
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-3">
          <p className="text-[10px] font-semibold text-sky-800">Cek in</p>
          <p className="mt-1 text-sm font-bold text-sky-950">
            {attendance ? formatTime(attendance.check_in_at) : "—"}
          </p>
          <p className="mt-0.5 text-[10px] text-sky-700">Jam mulai kerja</p>
        </article>
        <article className="rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50 p-3">
          <p className="text-[10px] font-semibold text-rose-800">Cek out</p>
          <p className="mt-1 text-sm font-bold text-rose-950">
            {attendance ? formatTime(attendance.check_out_at) : "—"}
          </p>
          <p className="mt-0.5 text-[10px] text-rose-700">Jam akhir kerja</p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-3">
          <p className="text-[10px] font-semibold text-blue-800">Jadwal kerja</p>
          <p className="mt-1 truncate text-sm font-bold text-blue-950">
            {scheduleLabel}
          </p>
          <p className="mt-0.5 text-[10px] text-blue-700">
            {selectedSchedule ? "Jadwal presensi hari ini" : "Jenis karyawan"}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
          <div>
            <h2 className="text-sm font-bold text-[#123a68]">
              Riwayat Absensi Terbaru
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Catatan presensi pribadi Anda.
            </p>
          </div>
          <Link
            className="shrink-0 text-[10px] font-semibold text-blue-700 hover:text-blue-900"
            href="/riwayat"
          >
            Lihat Semua <span aria-hidden="true">→</span>
          </Link>
        </div>
        {historyResult.error ? (
          <p className="p-4 text-xs leading-5 text-rose-700" role="alert">
            {historyResult.error}
          </p>
        ) : recentRecords.length ? (
          <ol className="divide-y divide-slate-100 px-4">
            {recentRecords.map((record) => (
              <li
                className="flex items-center gap-3 py-3 first:pt-3 last:pb-3"
                key={record.id}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                    record.check_out_at
                      ? "bg-blue-50 text-blue-600"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {record.check_out_at ? "↗" : "↘"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#123a68]">
                    Cek In · {formatTime(record.check_in_at)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {formatDate(record.work_date)}
                    {record.check_out_at
                      ? ` · Cek Out ${timeFormatter.format(new Date(record.check_out_at))} WIB`
                      : " · Belum cek out"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${
                    record.status === "hadir"
                      ? "bg-emerald-50 text-emerald-700"
                      : record.status === "terlambat"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {statusLabels[record.status]}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="p-4 text-xs text-slate-500">
            Belum ada riwayat presensi untuk ditampilkan.
          </p>
        )}
      </section>
    </>
  );
}

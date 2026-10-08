import type {
  AttendanceRecord,
  EmployeeWorkSchedule,
} from "@/lib/attendance/data";
import { AttendanceActions } from "@/components/attendance/attendance-actions";

function formatStatus(status: AttendanceRecord["status"]) {
  const labels: Record<AttendanceRecord["status"], string> = {
    hadir: "Hadir",
    terlambat: "Terlambat",
    izin: "Izin",
    sakit: "Sakit",
    cuti: "Cuti",
  };

  return labels[status];
}

export function AttendanceCard({
  attendance,
  error,
  canAttend,
  employeeStatus,
  schedules,
  scheduleError,
}: {
  attendance: AttendanceRecord | null;
  error: string | null;
  canAttend: boolean;
  employeeStatus: "harian" | "shift" | null;
  schedules: EmployeeWorkSchedule[] | null;
  scheduleError: string | null;
}) {
  const selectedSchedule = attendance?.schedule_id
    ? schedules?.find((schedule) => schedule.id === attendance.schedule_id)
    : null;

  return (
    <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-blue-50 to-white p-3 shadow-sm shadow-slate-900/5">
      <div className="rounded-2xl border border-blue-100/80 bg-white/60 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-blue-700">
                Status Kehadiran Hari Ini
              </p>
              <h2 className="mt-0.5 truncate text-base font-bold text-[#123a68]">
                {error
                  ? "Data presensi bermasalah"
                  : attendance
                    ? formatStatus(attendance.status)
                    : "Belum Absen"}
              </h2>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                {error
                  ? "Presensi belum dapat dimuat."
                  : attendance
                    ? attendance.check_out_at
                      ? "Presensi hari ini telah selesai."
                      : "Presensi tercatat. Silakan cek out setelah bekerja."
                    : "Silakan lakukan cek in untuk memulai aktivitas kerja Anda."}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${
              error
                ? "bg-rose-50 text-rose-800"
                : attendance
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-800"
            }`}
          >
            {error ? "Perlu perhatian" : attendance ? "Tercatat" : "Belum absen"}
          </span>
        </div>
        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-800" role="alert">
            {error} Pastikan migrasi database sudah dijalankan.
          </p>
        ) : attendance?.schedule_id ? (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/80 p-2.5">
            <p className="text-[10px] text-blue-700">Jam kerja dipilih</p>
            <p className="mt-0.5 text-xs font-semibold text-blue-950">
              {selectedSchedule
                ? `${selectedSchedule.name} · ${selectedSchedule.start_time.slice(0, 5)}–${selectedSchedule.end_time.slice(0, 5)} WIB`
                : "Jadwal tersimpan"}
            </p>
          </div>
        ) : null}
      </div>
      <AttendanceActions
        attendance={attendance}
        canAttend={canAttend && !error}
        employeeStatus={employeeStatus}
        scheduleError={scheduleError}
        schedules={schedules ?? []}
      />
    </section>
  );
}

import type {
  AttendanceRecord,
  EmployeeWorkSchedule,
} from "@/lib/attendance/data";
import { AttendanceActions } from "@/components/attendance/attendance-actions";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

function formatTime(value: string) {
  return `${timeFormatter.format(new Date(value))} WIB`;
}

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
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Presensi hari ini
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {error
              ? "Data presensi bermasalah"
              : attendance
                ? formatStatus(attendance.status)
                : "Belum ada presensi hari ini"}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            error
              ? "bg-rose-50 text-rose-800"
              : attendance
                ? "bg-emerald-50 text-emerald-800"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {error ? "Perlu perhatian" : attendance ? "Tercatat" : "Belum tercatat"}
        </span>
      </div>

      {error ? (
        <p className="mt-3 text-sm leading-6 text-rose-800" role="alert">
          {error} Pastikan migrasi database sudah dijalankan.
        </p>
      ) : attendance ? (
        <dl className="mt-4 grid grid-cols-2 gap-3">
          {attendance.schedule_id && (
            <div className="col-span-2 rounded-2xl bg-emerald-50 p-3">
              <dt className="text-xs text-emerald-700">Jam kerja dipilih</dt>
              <dd className="mt-1 font-semibold text-emerald-900">
                {selectedSchedule
                  ? `${selectedSchedule.name} · ${selectedSchedule.start_time.slice(0, 5)}–${selectedSchedule.end_time.slice(0, 5)}`
                  : "Jadwal tersimpan"}
              </dd>
            </div>
          )}
          <div className="rounded-2xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Jam masuk</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatTime(attendance.check_in_at)}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Jam keluar</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {attendance.check_out_at
                ? formatTime(attendance.check_out_at)
                : "Belum check-out"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Belum ada catatan presensi untuk hari ini.
        </p>
      )}
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

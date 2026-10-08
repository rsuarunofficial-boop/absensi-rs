import { AttendanceCard } from "@/components/attendance/attendance-card";
import {
  getEmployeeGroupSchedules,
  getEmployeeProfile,
  getTodayAttendance,
} from "@/lib/attendance/data";

export async function EmployeeDashboardData() {
  const [profileResult, attendanceResult] = await Promise.all([
    getEmployeeProfile(),
    getTodayAttendance(),
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

  return (
    <>
      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"
          >
            i
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">
              {profile ? `Halo, ${profile.full_name}` : "Profil karyawan"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {profileResult.error
                ? `${profileResult.error} Pastikan migrasi database sudah dijalankan.`
                : profile
                  ? `${[profile.position, profile.department].filter(Boolean).join(" · ") || "Karyawan RS Arun"} · Nomor pegawai: ${profile.employee_number ?? "Belum diisi"} · Status: ${profile.employee_status === "shift" ? "Shift" : "Harian"} · Grup jadwal: ${profile.shift_name ?? "Belum diatur"}`
                  : "Akun login aktif, tetapi profil pegawai belum dibuat. Hubungi administrator untuk mengisi data Anda."}
            </p>
          </div>
        </div>
      </section>

      <AttendanceCard
        attendance={attendanceResult.data}
        error={attendanceResult.error}
        canAttend={profile?.role === "karyawan" && !profileResult.error}
        employeeStatus={profile?.employee_status ?? null}
        schedules={scheduleResult.data}
        scheduleError={scheduleResult.error}
      />
    </>
  );
}

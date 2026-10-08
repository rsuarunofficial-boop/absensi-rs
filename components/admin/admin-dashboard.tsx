import Link from "next/link";
import {
  getAdminDashboardData,
  type AdminAttendance,
  type AdminEmployee,
} from "@/lib/admin/data";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const attendanceStatusLabels: Record<AdminAttendance["status"], string> = {
  hadir: "Hadir",
  terlambat: "Terlambat",
  izin: "Izin",
  sakit: "Sakit",
  cuti: "Cuti",
};

function statusStyle(status: AdminAttendance["status"]) {
  switch (status) {
    case "hadir":
      return "bg-emerald-100 text-emerald-800";
    case "terlambat":
      return "bg-amber-100 text-amber-800";
    case "izin":
      return "bg-sky-100 text-sky-800";
    case "sakit":
    case "cuti":
      return "bg-rose-100 text-rose-800";
  }
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
    ...options,
  }).format(new Date(`${value}T12:00:00+07:00`));
}

function getLastSevenDays(today: string) {
  const todayTimestamp = Date.parse(`${today}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayTimestamp - (6 - index) * 86_400_000);
    return date.toISOString().slice(0, 10);
  });
}

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: "users" | "check" | "clock" | "cross" | "calendar" | "file" | "person";
  className?: string;
}) {
  const paths = {
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    cross: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6m0-6-6 6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8m-8 4h8" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function getStatusIcon(status: AdminAttendance["status"]) {
  if (status === "hadir") return "check";
  if (status === "terlambat") return "clock";
  return "cross";
}

export async function AdminDashboard() {
  const result = await getAdminDashboardData();

  if (result.error) {
    return (
      <section
        className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-900"
        role="alert"
      >
        <h2 className="font-semibold">Dashboard tidak dapat dimuat</h2>
        <p className="mt-1">{result.error}</p>
        <p className="mt-2">
          Jalankan migrasi admin dan pastikan akun Anda memiliki role admin di
          profil karyawan.
        </p>
      </section>
    );
  }

  const employees = result.employees.filter(
    (employee) => employee.role === "karyawan"
  );
  const employeeIds = new Set(employees.map((employee) => employee.id));
  const attendance = result.attendance.filter((record) =>
    employeeIds.has(record.user_id)
  );
  const todayAttendance = attendance.filter(
    (record) => record.work_date === result.today
  );
  const latestAttendance = new Map<string, AdminAttendance>();

  todayAttendance.forEach((record) => {
    if (!latestAttendance.has(record.user_id)) {
      latestAttendance.set(record.user_id, record);
    }
  });

  const counts = {
    employees: employees.length,
    present: [...latestAttendance.values()].filter(
      (record) => record.status === "hadir"
    ).length,
    late: [...latestAttendance.values()].filter(
      (record) => record.status === "terlambat"
    ).length,
    noRecord: employees.filter(
      (employee) => !latestAttendance.has(employee.id)
    ).length,
  };

  const dayRecords = new Map<string, Map<string, AdminAttendance>>();
  for (const record of attendance) {
    if (!dayRecords.has(record.work_date)) {
      dayRecords.set(record.work_date, new Map());
    }
    const recordsForDay = dayRecords.get(record.work_date);
    if (recordsForDay && !recordsForDay.has(record.user_id)) {
      recordsForDay.set(record.user_id, record);
    }
  }

  const lastSevenDays = getLastSevenDays(result.today);
  const dailySummary = lastSevenDays.map((date) => {
    const records = [...(dayRecords.get(date)?.values() ?? [])];
    const recordedCount = records.length;
    return {
      date,
      present: records.filter((record) => record.status === "hadir").length,
      late: records.filter((record) => record.status === "terlambat").length,
      other: records.filter(
        (record) => record.status !== "hadir" && record.status !== "terlambat"
      ).length,
      unrecorded: Math.max(0, employees.length - recordedCount),
    };
  });

  const otherStatuses = [...latestAttendance.values()].filter(
    (record) => record.status !== "hadir" && record.status !== "terlambat"
  ).length;
  const stats = [
    {
      label: "Total karyawan",
      value: counts.employees,
      note: `${employees.filter((employee) => employee.employee_status === "shift").length} karyawan shift`,
      tone: "blue",
      icon: "users",
    },
    {
      label: "Hadir hari ini",
      value: counts.present,
      note: `${counts.employees ? Math.round((counts.present / counts.employees) * 100) : 0}% dari total karyawan`,
      tone: "green",
      icon: "check",
    },
    {
      label: "Terlambat hari ini",
      value: counts.late,
      note: `${counts.employees ? Math.round((counts.late / counts.employees) * 100) : 0}% dari total karyawan`,
      tone: "amber",
      icon: "clock",
    },
    {
      label: "Belum tercatat",
      value: counts.noRecord,
      note: "Belum ada presensi hari ini",
      tone: "red",
      icon: "cross",
    },
  ] as const;
  const employeeById = new Map(
    result.employees.map((employee) => [employee.id, employee])
  );
  const latestRecords = attendance.slice(0, 5);
  const total = counts.employees;
  const presentEnd = total ? (counts.present / total) * 100 : 0;
  const lateEnd = total
    ? presentEnd + (counts.late / total) * 100
    : 0;
  const otherEnd = total
    ? lateEnd + (otherStatuses / total) * 100
    : 0;
  const donutBackground = total
    ? `conic-gradient(#10b981 0% ${presentEnd}%, #f59e0b ${presentEnd}% ${lateEnd}%, #fb7185 ${lateEnd}% ${otherEnd}%, #cbd5e1 ${otherEnd}% 100%)`
    : "conic-gradient(#e2e8f0 0% 100%)";
  const chartMaximum = Math.max(employees.length, 1);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={`flex min-h-28 items-center gap-4 rounded-2xl border p-4 shadow-sm ${
              stat.tone === "blue"
                ? "border-blue-100 bg-gradient-to-br from-white to-blue-50"
                : stat.tone === "green"
                  ? "border-emerald-100 bg-gradient-to-br from-white to-emerald-50"
                  : stat.tone === "amber"
                    ? "border-amber-100 bg-gradient-to-br from-white to-amber-50"
                    : "border-rose-100 bg-gradient-to-br from-white to-rose-50"
            }`}
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
                stat.tone === "blue"
                  ? "bg-blue-500"
                  : stat.tone === "green"
                    ? "bg-emerald-500"
                    : stat.tone === "amber"
                      ? "bg-amber-500"
                      : "bg-rose-500"
              }`}
            >
              <Icon name={stat.icon} className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
              <p className="mt-0.5 text-3xl font-extrabold leading-none text-[#102d50]">
                {stat.value}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-500">{stat.note}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[1.15fr_1fr_0.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5">
            <h2 className="font-bold text-[#102d50]">
              Rekap Kehadiran 7 Hari Terakhir
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Berdasarkan catatan presensi yang tersedia.
            </p>
          </div>
          {employees.length ? (
            <>
              <div className="relative flex h-48 items-end justify-around gap-2 border-b border-l border-slate-200 px-2 pb-0 pt-4">
                <div className="pointer-events-none absolute inset-x-0 top-4 flex h-36 flex-col justify-between">
                  <span className="border-t border-dashed border-slate-100" />
                  <span className="border-t border-dashed border-slate-100" />
                  <span className="border-t border-dashed border-slate-100" />
                  <span className="border-t border-dashed border-slate-100" />
                </div>
                {dailySummary.map((day) => {
                  const dayTotal =
                    day.present + day.late + day.other + day.unrecorded;
                  const height = (dayTotal / chartMaximum) * 100;
                  const segmentHeight = (value: number) =>
                    dayTotal ? (value / dayTotal) * 100 : 0;

                  return (
                    <div
                      key={day.date}
                      aria-label={`${formatDate(day.date)}: ${day.present} hadir, ${day.late} terlambat, ${day.unrecorded} belum tercatat`}
                      className="relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                      role="img"
                    >
                      <div
                        className="flex w-full max-w-8 flex-col-reverse overflow-hidden rounded-t-md"
                        style={{ height: `${height}%` }}
                      >
                        <span
                          className="bg-emerald-500"
                          style={{ height: `${segmentHeight(day.present)}%` }}
                        />
                        <span
                          className="bg-amber-400"
                          style={{ height: `${segmentHeight(day.late)}%` }}
                        />
                        <span
                          className="bg-rose-400"
                          style={{ height: `${segmentHeight(day.other)}%` }}
                        />
                        <span
                          className="bg-slate-200"
                          style={{ height: `${segmentHeight(day.unrecorded)}%` }}
                        />
                      </div>
                      <span className="absolute -bottom-6 whitespace-nowrap text-[10px] text-slate-500">
                        {formatDate(day.date, { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-9 flex flex-wrap justify-center gap-x-3 gap-y-2 text-[10px] text-slate-600">
                {[
                  ["bg-emerald-500", "Hadir"],
                  ["bg-amber-400", "Terlambat"],
                  ["bg-rose-400", "Izin / sakit / cuti"],
                  ["bg-slate-300", "Belum tercatat"],
                ].map(([color, label]) => (
                  <span key={label} className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Belum ada profil karyawan dengan role karyawan.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="font-bold text-[#102d50]">Status Kehadiran Hari Ini</h2>
            <p className="mt-1 text-xs text-slate-500">
              Ringkasan status dari seluruh karyawan.
            </p>
          </div>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
            <div
              aria-label={`Status presensi hari ini untuk ${counts.employees} karyawan`}
              className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
              role="img"
              style={{ background: donutBackground }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center">
                <span className="text-2xl font-extrabold text-[#102d50]">
                  {counts.employees}
                </span>
                <span className="text-xs text-slate-500">Karyawan</span>
              </div>
            </div>
            <ul className="w-full space-y-3">
              {[
                { label: "Hadir", count: counts.present, color: "bg-emerald-500" },
                { label: "Terlambat", count: counts.late, color: "bg-amber-400" },
                { label: "Izin / sakit / cuti", count: otherStatuses, color: "bg-rose-400" },
                { label: "Belum tercatat", count: counts.noRecord, color: "bg-slate-300" },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-xs">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} />
                  <span className="min-w-0 flex-1 text-slate-600">{item.label}</span>
                  <span className="w-7 text-right font-bold text-[#102d50]">
                    {item.count}
                  </span>
                  <span className="w-10 text-right text-slate-400">
                    {total ? `${Math.round((item.count / total) * 100)}%` : "0%"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <div>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-bold text-[#102d50]">Aksi Cepat</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-2 text-center text-xs font-semibold text-[#164779] transition hover:border-blue-300 hover:bg-blue-50"
                href="/admin/data"
              >
                <Icon name="person" className="h-6 w-6 text-blue-600" />
                Kelola Karyawan
              </Link>
              <Link
                className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-2 text-center text-xs font-semibold text-[#164779] transition hover:border-blue-300 hover:bg-blue-50"
                href="/admin/laporan"
              >
                <Icon name="file" className="h-6 w-6 text-blue-600" />
                Laporan Presensi
              </Link>
              <Link
                className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-2 text-center text-xs font-semibold text-[#164779] transition hover:border-blue-300 hover:bg-blue-50"
                href="/"
              >
                <Icon name="calendar" className="h-6 w-6 text-blue-600" />
                Aplikasi Presensi
              </Link>
              <Link
                className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-2 text-center text-xs font-semibold text-[#164779] transition hover:border-blue-300 hover:bg-blue-50"
                href="/admin/data"
              >
                <Icon name="users" className="h-6 w-6 text-blue-600" />
                Data & Jadwal
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(250px,3fr)]">
        <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-bold text-[#102d50]">Presensi Terbaru</h2>
              <p className="mt-1 text-xs text-slate-500">
                Catatan terbaru dari seluruh karyawan.
              </p>
            </div>
            <Link
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
              href="/admin/laporan"
            >
              Lihat laporan <span aria-hidden="true">→</span>
            </Link>
          </div>
          {latestRecords.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold sm:px-5">No.</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Nama Karyawan</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">NIP</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Unit</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Status</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latestRecords.map((record, index) => {
                    const employee: AdminEmployee | undefined = employeeById.get(
                      record.user_id
                    );

                    return (
                      <tr key={record.id} className="transition hover:bg-blue-50/40">
                        <td className="px-4 py-3 font-medium text-slate-400 sm:px-5">
                          {index + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                              <Icon name="person" className="h-4 w-4" />
                            </span>
                            <span>
                              <span className="block font-semibold text-slate-800">
                                {employee?.full_name ?? "Profil belum terhubung"}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {employee?.position ?? "Karyawan"}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-5">
                          {employee?.employee_number ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-5">
                          {employee?.department ?? "Belum ditentukan"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-semibold ${statusStyle(record.status)}`}
                          >
                            {attendanceStatusLabels[record.status]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-5">
                          {timeFormatter.format(new Date(record.check_in_at))} WIB
                          <span className="ml-1.5 text-[10px] text-slate-400">
                            {formatDate(record.work_date, {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-600">
              Belum ada catatan presensi yang dapat ditampilkan.
            </p>
          )}
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-bold text-[#102d50]">Aktivitas Terbaru</h2>
          {latestRecords.length ? (
            <ol className="mt-3 divide-y divide-slate-100">
              {latestRecords.map((record) => {
                const employee = employeeById.get(record.user_id);

                return (
                  <li key={record.id} className="flex gap-2.5 py-3 first:pt-1 last:pb-0">
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        record.status === "hadir"
                          ? "bg-emerald-100 text-emerald-700"
                          : record.status === "terlambat"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      <Icon name={getStatusIcon(record.status)} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-700">
                        {attendanceStatusLabels[record.status]} ·{" "}
                        {employee?.full_name ?? "Profil belum terhubung"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {formatDate(record.work_date)} ·{" "}
                        {timeFormatter.format(new Date(record.check_in_at))} WIB
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              Belum ada aktivitas presensi.
            </p>
          )}
        </article>
      </section>
      <p className="text-xs leading-5 text-slate-500">
        Dashboard ini hanya untuk pemantauan. Perubahan profil dan koreksi
        presensi dilakukan melalui proses administrasi yang telah disetujui.
      </p>
    </div>
  );
}

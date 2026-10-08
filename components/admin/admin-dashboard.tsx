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

function getDepartmentSummary(
  employees: AdminEmployee[],
  attendance: AdminAttendance[]
) {
  const attendanceByEmployee = new Map<string, AdminAttendance["status"]>();

  attendance.forEach((record) => {
    if (!attendanceByEmployee.has(record.user_id)) {
      attendanceByEmployee.set(record.user_id, record.status);
    }
  });

  const summary = new Map<
    string,
    { total: number; present: number; late: number; absent: number }
  >();

  employees
    .filter((employee) => employee.role === "karyawan")
    .forEach((employee) => {
      const department = employee.department || "Belum ditentukan";
      const item = summary.get(department) ?? {
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
      };
      const status = attendanceByEmployee.get(employee.id);

      item.total += 1;
      if (status === "hadir") item.present += 1;
      else if (status === "terlambat") item.late += 1;
      else if (!status) item.absent += 1;
      summary.set(department, item);
    });

  return [...summary.entries()].sort((a, b) => a[0].localeCompare(b[0], "id"));
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
  const todayAttendance = result.attendance.filter(
    (record) => record.work_date === result.today
  );
  const employeeAttendanceToday = todayAttendance.filter((record) =>
    employeeIds.has(record.user_id)
  );
  const latestAttendance = new Map<string, AdminAttendance>();

  employeeAttendanceToday.forEach((record) => {
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

  const stats = [
    { label: "Total karyawan", value: counts.employees, tone: "slate" },
    { label: "Hadir", value: counts.present, tone: "emerald" },
    { label: "Terlambat", value: counts.late, tone: "amber" },
    { label: "Belum tercatat", value: counts.noRecord, tone: "sky" },
  ] as const;

  const departments = getDepartmentSummary(employees, employeeAttendanceToday);
  const employeeById = new Map(
    result.employees.map((employee) => [employee.id, employee])
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                stat.tone === "emerald"
                  ? "text-emerald-700"
                  : stat.tone === "amber"
                    ? "text-amber-700"
                    : stat.tone === "sky"
                      ? "text-sky-700"
                      : "text-slate-900"
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">Data hari ini</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Kehadiran per unit
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ringkasan berdasarkan profil karyawan dan presensi hari ini.
            </p>
          </div>
          {departments.length ? (
            <div className="space-y-5">
              {departments.map(([department, summary]) => {
                const percent = summary.total
                  ? Math.round(
                      ((summary.present + summary.late) / summary.total) * 100
                    )
                  : 0;

                return (
                  <div key={department}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-slate-800">
                        {department}
                      </span>
                      <span className="text-slate-500">
                        {summary.present} hadir · {summary.late} terlambat ·{" "}
                        {summary.absent} belum tercatat
                      </span>
                    </div>
                    <div
                      aria-label={`${department}: ${percent}% tercatat hadir`}
                      className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                      role="img"
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Belum ada profil karyawan dengan role karyawan.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Karyawan</h2>
            <p className="mt-1 text-sm text-slate-500">
              {employees.length} profil terdaftar
            </p>
          </div>
          {employees.length ? (
            <ul className="divide-y divide-slate-100">
              {employees.slice(0, 8).map((employee) => (
                <li
                  key={employee.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {employee.full_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {employee.department || "Unit belum diatur"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    {employee.shift_name || "Tanpa grup jadwal"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Data karyawan belum tersedia.
            </p>
          )}
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            Riwayat presensi terbaru
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Maksimal 20 catatan terbaru dari seluruh tanggal.
          </p>
        </div>
        {result.attendance.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Karyawan</th>
                  <th className="px-5 py-3 font-semibold">Unit</th>
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Masuk</th>
                  <th className="px-5 py-3 font-semibold">Keluar</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.attendance.slice(0, 20).map((record) => {
                  const employee = employeeById.get(record.user_id);

                  return (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">
                        {employee?.full_name ?? "Profil belum terhubung"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {employee?.department ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Jakarta",
                        }).format(
                          new Date(`${record.work_date}T12:00:00+07:00`)
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {timeFormatter.format(new Date(record.check_in_at))} WIB
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {record.check_out_at
                          ? `${timeFormatter.format(new Date(record.check_out_at))} WIB`
                          : "Belum check-out"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(record.status)}`}
                        >
                          {attendanceStatusLabels[record.status]}
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
      </section>
      <p className="text-xs leading-5 text-slate-500">
        Dashboard ini hanya untuk pemantauan. Perubahan profil dan koreksi
        presensi dilakukan melalui proses administrasi yang telah disetujui.
      </p>
    </div>
  );
}

import "server-only";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import {
  getExpectedTimestamp,
  minutesBetween,
} from "@/lib/admin/attendance-calculation";
import { createClient } from "@/lib/supabase/server";

export type AdminEmployee = {
  id: string;
  employee_number: string | null;
  full_name: string;
  department: string | null;
  position: string | null;
  shift_name: string | null;
  employee_status: "harian" | "shift";
  work_schedule_id: string | null;
  schedule_group_id: string | null;
  role: "admin" | "karyawan";
};

export type AdminAttendance = {
  id: string;
  user_id: string;
  work_date: string;
  check_in_at: string;
  check_out_at: string | null;
  lateMinutes: number | null;
  status: "hadir" | "terlambat" | "izin" | "sakit" | "cuti";
};

type DashboardSchedule = {
  id: string;
  name: string;
  start_time: string;
  group_id: string | null;
};

export type AdminDashboardData =
  | {
      employees: AdminEmployee[];
      attendance: AdminAttendance[];
      today: string;
      error: null;
    }
  | { employees: []; attendance: []; today: string; error: string };

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await io();
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    if (authError) console.error("Failed to verify admin session:", authError);
    redirect("/login");
  }

  const currentDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { data: currentEmployee, error: roleError } = await supabase
    .from("employee_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    console.error("Failed to load admin role:", roleError);
    return {
      employees: [],
      attendance: [],
      today: currentDate,
      error: "Hak akses admin tidak dapat diverifikasi. Periksa migrasi database.",
    };
  }

  if (currentEmployee?.role !== "admin") {
    redirect("/");
  }

  const [employeesResult, attendanceResult, schedulesResult] = await Promise.all([
    supabase
      .from("employee_profiles")
      .select(
        "id, employee_number, full_name, department, position, shift_name, employee_status, work_schedule_id, schedule_group_id, role"
      )
      .order("full_name", { ascending: true })
      .limit(1000),
    supabase
      .from("attendance_records")
      .select(
        "id, user_id, work_date, check_in_at, check_out_at, schedule_id, status"
      )
      .order("work_date", { ascending: false })
      .order("check_in_at", { ascending: false })
      .limit(1000),
    supabase
      .from("work_schedules")
      .select("id, name, start_time, group_id"),
  ]);

  if (
    employeesResult.error ||
    attendanceResult.error ||
    schedulesResult.error
  ) {
    const error =
      employeesResult.error ??
      attendanceResult.error ??
      schedulesResult.error;
    console.error("Failed to load admin dashboard data:", error);
    return {
      employees: [],
      attendance: [],
      today: currentDate,
      error: "Data dashboard tidak dapat dimuat. Periksa tabel dan kebijakan RLS.",
    };
  }

  const employeeById = new Map(
    (employeesResult.data ?? []).map((employee) => [employee.id, employee])
  );
  const scheduleById = new Map(
    (schedulesResult.data ?? []).map((schedule) => [schedule.id, schedule])
  );
  const schedulesByGroupId = new Map<string, DashboardSchedule[]>();
  for (const schedule of schedulesResult.data ?? []) {
    if (!schedule.group_id) continue;
    const groupSchedules = schedulesByGroupId.get(schedule.group_id) ?? [];
    groupSchedules.push(schedule);
    schedulesByGroupId.set(schedule.group_id, groupSchedules);
  }

  const attendance = (attendanceResult.data ?? []).map((record) => {
    const employee = employeeById.get(record.user_id);
    const groupSchedules = employee?.schedule_group_id
      ? schedulesByGroupId.get(employee.schedule_group_id) ?? []
      : [];
    const schedule =
      (record.schedule_id ? scheduleById.get(record.schedule_id) : undefined) ??
      (employee?.work_schedule_id
        ? scheduleById.get(employee.work_schedule_id)
        : undefined) ??
      (employee?.employee_status === "harian"
        ? groupSchedules.find(
            (groupSchedule) =>
              groupSchedule.name.trim().toLowerCase() === "reguler"
          )
        : undefined) ??
      (groupSchedules.length === 1 ? groupSchedules[0] : undefined);
    const expectedStart = schedule
      ? getExpectedTimestamp(record.work_date, schedule.start_time.slice(0, 5))
      : null;
    const checkIn = Date.parse(record.check_in_at);
    const lateMinutes =
      expectedStart === null || !Number.isFinite(checkIn)
        ? null
        : minutesBetween(checkIn, expectedStart);

    return {
      ...record,
      lateMinutes,
      status:
        lateMinutes !== null && lateMinutes > 0
          ? "terlambat" as const
          : record.status,
    };
  });

  return {
    employees: employeesResult.data ?? [],
    attendance,
    today: currentDate,
    error: null,
  };
}

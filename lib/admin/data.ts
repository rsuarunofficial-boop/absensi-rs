import "server-only";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminEmployee = {
  id: string;
  employee_number: string | null;
  full_name: string;
  department: string | null;
  position: string | null;
  shift_name: string | null;
  role: "admin" | "karyawan";
};

export type AdminAttendance = {
  id: string;
  user_id: string;
  work_date: string;
  check_in_at: string;
  check_out_at: string | null;
  status: "hadir" | "terlambat" | "izin" | "sakit" | "cuti";
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

  const [employeesResult, attendanceResult] = await Promise.all([
    supabase
      .from("employee_profiles")
      .select(
        "id, employee_number, full_name, department, position, shift_name, role"
      )
      .order("full_name", { ascending: true })
      .limit(1000),
    supabase
      .from("attendance_records")
      .select("id, user_id, work_date, check_in_at, check_out_at, status")
      .order("work_date", { ascending: false })
      .order("check_in_at", { ascending: false })
      .limit(1000),
  ]);

  if (employeesResult.error || attendanceResult.error) {
    const error = employeesResult.error ?? attendanceResult.error;
    console.error("Failed to load admin dashboard data:", error);
    return {
      employees: [],
      attendance: [],
      today: currentDate,
      error: "Data dashboard tidak dapat dimuat. Periksa tabel dan kebijakan RLS.",
    };
  }

  return {
    employees: employeesResult.data ?? [],
    attendance: attendanceResult.data ?? [],
    today: currentDate,
    error: null,
  };
}

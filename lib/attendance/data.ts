import { io } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EmployeeProfile = {
  id: string;
  employee_number: string | null;
  full_name: string;
  department: string | null;
  position: string | null;
  shift_name: string | null;
  employee_status: "harian" | "shift";
  schedule_group_id: string | null;
  role: "admin" | "karyawan";
};

export type EmployeeWorkSchedule = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
};

export type AttendanceRecord = {
  id: string;
  work_date: string;
  check_in_at: string;
  check_out_at: string | null;
  schedule_id: string | null;
  status: "hadir" | "terlambat" | "izin" | "sakit" | "cuti";
};

export type AttendanceActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type DataResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

async function getCurrentUserId(): Promise<DataResult<string>> {
  await io();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to verify employee session:", error);
    return { data: null, error: "Sesi pengguna tidak dapat diverifikasi." };
  }

  if (!data.user) {
    return {
      data: null,
      error: "Sesi pengguna tidak ditemukan. Silakan masuk kembali.",
    };
  }

  return { data: data.user.id, error: null };
}

export async function getEmployeeProfile(): Promise<
  DataResult<EmployeeProfile | null>
> {
  const userIdResult = await getCurrentUserId();
  if (userIdResult.error) return userIdResult;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_profiles")
    .select(
      "id, employee_number, full_name, department, position, shift_name, employee_status, schedule_group_id, role"
    )
    .eq("id", userIdResult.data)
    .maybeSingle();

  if (error) {
    console.error("Failed to load employee profile:", error);
    return { data: null, error: "Profil karyawan tidak dapat dimuat." };
  }

  return { data, error: null };
}

export async function getEmployeeGroupSchedules(
  groupId: string
): Promise<DataResult<EmployeeWorkSchedule[]>> {
  const userIdResult = await getCurrentUserId();
  if (userIdResult.error) return userIdResult;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_schedules")
    .select("id, name, start_time, end_time")
    .eq("group_id", groupId)
    .order("start_time");

  if (error) {
    console.error("Failed to load employee group schedules:", error);
    return {
      data: null,
      error: "Pilihan jam kerja tidak dapat dimuat.",
    };
  }

  return { data, error: null };
}

export async function getTodayAttendance(): Promise<
  DataResult<AttendanceRecord | null>
> {
  const userIdResult = await getCurrentUserId();
  if (userIdResult.error) return userIdResult;

  const currentDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, work_date, check_in_at, check_out_at, schedule_id, status")
    .eq("user_id", userIdResult.data)
    .eq("work_date", currentDate)
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load today's attendance:", error);
    return { data: null, error: "Presensi hari ini tidak dapat dimuat." };
  }

  return { data, error: null };
}

export async function getAttendanceHistory(): Promise<
  DataResult<AttendanceRecord[]>
> {
  const userIdResult = await getCurrentUserId();
  if (userIdResult.error) return userIdResult;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, work_date, check_in_at, check_out_at, schedule_id, status")
    .eq("user_id", userIdResult.data)
    .order("work_date", { ascending: false })
    .order("check_in_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("Failed to load attendance history:", error);
    return { data: null, error: "Riwayat presensi tidak dapat dimuat." };
  }

  return { data, error: null };
}
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceActionState } from "@/lib/attendance/data";

type EmployeeContext =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      userId: string;
      workDate: string;
      employeeStatus: "harian" | "shift";
      scheduleGroupId: string | null;
    }
  | { ok: false; error: string };

function getWorkDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function getEmployeeContext(): Promise<EmployeeContext> {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Failed to verify attendance session:", authError);
    return { ok: false, error: "Sesi pengguna tidak dapat diverifikasi." };
  }

  if (!userData.user) {
    return {
      ok: false,
      error: "Sesi pengguna tidak ditemukan. Silakan masuk kembali.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("employee_profiles")
    .select("role, employee_status, schedule_group_id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to verify employee profile for attendance:", profileError);
    return { ok: false, error: "Profil karyawan tidak dapat diverifikasi." };
  }

  if (!profile || profile.role !== "karyawan") {
    return {
      ok: false,
      error: "Aksi presensi hanya tersedia untuk akun karyawan.",
    };
  }

  return {
    ok: true,
    supabase,
    userId: userData.user.id,
    workDate: getWorkDate(),
    employeeStatus: profile.employee_status,
    scheduleGroupId: profile.schedule_group_id,
  };
}

export async function checkInAttendance(
  _previousState: AttendanceActionState,
  formData: FormData
): Promise<AttendanceActionState> {
  void _previousState;
  const context = await getEmployeeContext();
  if (!context.ok) return { status: "error", message: context.error };

  const scheduleIdValue = formData.get("schedule_id");
  const scheduleId =
    typeof scheduleIdValue === "string" && scheduleIdValue
      ? scheduleIdValue
      : null;

  if (context.employeeStatus === "shift" && !scheduleId) {
    return { status: "error", message: "Pilih jam kerja sebelum cek in." };
  }
  if (context.employeeStatus === "harian" && scheduleId) {
    return {
      status: "error",
      message: "Karyawan harian tidak memilih jam kerja shift.",
    };
  }

  if (scheduleId) {
    if (!context.scheduleGroupId) {
      return {
        status: "error",
        message: "Grup jadwal belum diatur pada profil Anda.",
      };
    }

    const { data: schedule, error: scheduleError } = await context.supabase
      .from("work_schedules")
      .select("id")
      .eq("id", scheduleId)
      .eq("group_id", context.scheduleGroupId)
      .maybeSingle();

    if (scheduleError) {
      console.error("Failed to verify selected employee schedule:", scheduleError);
      return {
        status: "error",
        message: "Jam kerja yang dipilih tidak dapat diverifikasi.",
      };
    }
    if (!schedule) {
      return {
        status: "error",
        message: "Jam kerja yang dipilih tidak termasuk grup jadwal Anda.",
      };
    }
  }

  const now = new Date();
  const activeSince = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const { data: activeAttendance, error: activeError } = await context.supabase
    .from("attendance_records")
    .select("id")
    .eq("user_id", context.userId)
    .is("check_out_at", null)
    .gte("check_in_at", activeSince.toISOString())
    .lte("check_in_at", now.toISOString())
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError) {
    console.error("Failed to check for active attendance:", activeError);
    return {
      status: "error",
      message: "Presensi aktif tidak dapat diperiksa.",
    };
  }

  if (activeAttendance) {
    return {
      status: "error",
      message: "Anda masih memiliki sesi presensi yang belum cek out.",
    };
  }

  const { data: existing, error: lookupError } = await context.supabase
    .from("attendance_records")
    .select("id")
    .eq("user_id", context.userId)
    .eq("work_date", context.workDate)
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("Failed to check for existing attendance:", lookupError);
    return { status: "error", message: "Presensi hari ini tidak dapat diperiksa." };
  }

  if (existing) {
    return { status: "error", message: "Anda sudah melakukan cek in hari ini." };
  }

  const { error: insertError } = await context.supabase
    .from("attendance_records")
    .insert({
      user_id: context.userId,
      work_date: context.workDate,
      check_in_at: now.toISOString(),
      schedule_id: scheduleId,
    });

  if (insertError) {
    console.error("Failed to save attendance check-in:", insertError);
    return { status: "error", message: "Cek in gagal disimpan. Silakan coba lagi." };
  }

  revalidatePath("/");
  return { status: "success", message: "Cek in berhasil dicatat." };
}

export async function checkOutAttendance(
  _previousState: AttendanceActionState,
  _formData: FormData
): Promise<AttendanceActionState> {
  void _previousState;
  void _formData;
  const context = await getEmployeeContext();
  if (!context.ok) return { status: "error", message: context.error };

  const now = new Date();
  const activeSince = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const { data: attendance, error: lookupError } = await context.supabase
    .from("attendance_records")
    .select("id")
    .eq("user_id", context.userId)
    .is("check_out_at", null)
    .gte("check_in_at", activeSince.toISOString())
    .lte("check_in_at", now.toISOString())
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("Failed to find active attendance for check-out:", lookupError);
    return {
      status: "error",
      message: "Data presensi aktif tidak dapat diperiksa.",
    };
  }

  if (!attendance) {
    return {
      status: "error",
      message: "Tidak ada sesi presensi aktif dalam 24 jam terakhir.",
    };
  }

  const { data: updatedAttendance, error: updateError } = await context.supabase
    .from("attendance_records")
    .update({ check_out_at: now.toISOString() })
    .eq("id", attendance.id)
    .eq("user_id", context.userId)
    .is("check_out_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Failed to save attendance check-out:", updateError);
    return { status: "error", message: "Cek out gagal disimpan. Silakan coba lagi." };
  }

  if (!updatedAttendance) {
    return { status: "error", message: "Sesi presensi ini sudah diakhiri." };
  }

  revalidatePath("/");
  return { status: "success", message: "Cek out berhasil dicatat." };
}

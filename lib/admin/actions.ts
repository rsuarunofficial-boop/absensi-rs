"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createAdminClient,
  isAdminClientConfigured,
} from "@/lib/supabase/admin";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const failed = (message: string): AdminActionState => ({
  status: "error",
  message,
});

function readText(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

async function verifyAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to verify admin session for management action:", error);
    return { ok: false as const };
  }
  if (!data.user) return { ok: false as const };

  const { data: profile, error: profileError } = await supabase
    .from("employee_profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to verify admin role for management action:", profileError);
    return { ok: false as const };
  }

  return profile?.role === "admin"
    ? { ok: true as const, supabase }
    : { ok: false as const };
}

export async function createWorkUnit(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await verifyAdmin();
  if (!admin.ok) {
    return failed("Aksi ini hanya tersedia untuk admin.");
  }

  const name = readText(formData, "name", 100);
  const description = readText(formData, "description", 500);
  if (!name) return failed("Nama unit wajib diisi (maksimal 100 karakter).");

  const { error } = await admin.supabase.from("work_units").insert({
    name,
    description,
  });

  if (error) {
    console.error("Failed to create work unit:", error);
    return failed(
      error.code === "23505"
        ? "Nama unit kerja tersebut sudah terdaftar."
        : "Unit kerja gagal disimpan."
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/data");
  return { status: "success", message: "Unit kerja berhasil ditambahkan." };
}

export async function createScheduleGroup(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await verifyAdmin();
  if (!admin.ok) return failed("Aksi ini hanya tersedia untuk admin.");

  const name = readText(formData, "name", 100);
  const description = readText(formData, "description", 500);
  if (!name) return failed("Nama grup wajib diisi (maksimal 100 karakter).");

  const { error } = await admin.supabase.from("schedule_groups").insert({
    name,
    description,
  });

  if (error) {
    console.error("Failed to create schedule group:", error);
    return failed(
      error.code === "23505"
        ? "Nama grup jadwal tersebut sudah terdaftar."
        : "Grup jadwal gagal disimpan."
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/data");
  return { status: "success", message: "Grup jadwal berhasil ditambahkan." };
}

export async function mapScheduleToGroup(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await verifyAdmin();
  if (!admin.ok) return failed("Aksi ini hanya tersedia untuk admin.");

  const scheduleId = readText(formData, "schedule_id", 36);
  const groupId = readText(formData, "group_id", 36);
  if (!scheduleId || !groupId) {
    return failed("Pilih jam kerja dan grup jadwal.");
  }

  const { data: schedule, error: scheduleError } = await admin.supabase
    .from("work_schedules")
    .select("id")
    .eq("id", scheduleId)
    .maybeSingle();
  const { data: group, error: groupError } = await admin.supabase
    .from("schedule_groups")
    .select("id")
    .eq("id", groupId)
    .maybeSingle();

  if (scheduleError || groupError) {
    console.error("Failed to validate schedule group mapping:", {
      scheduleError,
      groupError,
    });
    return failed("Jam kerja atau grup tidak dapat diverifikasi.");
  }
  if (!schedule || !group) {
    return failed("Jam kerja atau grup yang dipilih tidak ditemukan.");
  }

  const { error } = await admin.supabase
    .from("work_schedules")
    .update({ group_id: group.id })
    .eq("id", schedule.id);

  if (error) {
    console.error("Failed to map schedule to group:", error);
    return failed("Pemetaan jam kerja ke grup gagal disimpan.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/data");
  return { status: "success", message: "Jam kerja berhasil dipetakan ke grup." };
}

export async function updateEmployeeScheduleGroup(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await verifyAdmin();
  if (!admin.ok) return failed("Aksi ini hanya tersedia untuk admin.");

  const employeeId = readText(formData, "employee_id", 36);
  const groupId = readText(formData, "group_id", 36);
  const employeeStatus = readText(formData, "employee_status", 10);
  if (!employeeId || !groupId) {
    return failed("Pilih karyawan dan grup jadwal.");
  }
  if (employeeStatus !== "harian" && employeeStatus !== "shift") {
    return failed("Pilih status karyawan Harian atau Shift.");
  }

  const [{ data: employee, error: employeeError }, { data: group, error: groupError }] =
    await Promise.all([
      admin.supabase
        .from("employee_profiles")
        .select("id")
        .eq("id", employeeId)
        .eq("role", "karyawan")
        .maybeSingle(),
      admin.supabase
        .from("schedule_groups")
        .select("id, name")
        .eq("id", groupId)
        .maybeSingle(),
    ]);

  if (employeeError || groupError) {
    console.error("Failed to validate employee schedule group:", {
      employeeError,
      groupError,
    });
    return failed("Data karyawan atau grup jadwal tidak dapat diverifikasi.");
  }
  if (!employee || !group) {
    return failed("Karyawan atau grup jadwal yang dipilih tidak ditemukan.");
  }

  const { error } = await admin.supabase
    .from("employee_profiles")
    .update({
      employee_status: employeeStatus,
      schedule_group_id: group.id,
      shift_name: group.name,
    })
    .eq("id", employee.id)
    .eq("role", "karyawan");

  if (error) {
    console.error("Failed to update employee schedule group:", error);
    return failed("Status dan grup jadwal karyawan gagal diperbarui.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/data");
  revalidatePath("/");
  revalidatePath("/profil");
  revalidatePath("/admin/laporan");
  return {
    status: "success",
    message: "Status dan grup jadwal karyawan berhasil diperbarui.",
  };
}

export async function createWorkSchedule(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await verifyAdmin();
  if (!admin.ok) {
    return failed("Aksi ini hanya tersedia untuk admin.");
  }

  const name = readText(formData, "name", 100);
  const startTime = readText(formData, "start_time", 5);
  const endTime = readText(formData, "end_time", 5);
  const description = readText(formData, "description", 500);
  const groupId = readText(formData, "group_id", 36);

  if (!name || !startTime || !endTime || !groupId) {
    return failed("Nama jadwal, jam mulai, jam selesai, dan grup wajib diisi.");
  }
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)
  ) {
    return failed("Format jam tidak valid.");
  }

  const { data: group, error: groupError } = await admin.supabase
    .from("schedule_groups")
    .select("id")
    .eq("id", groupId)
    .maybeSingle();
  if (groupError) {
    console.error("Failed to verify schedule group:", groupError);
    return failed("Grup jadwal tidak dapat diverifikasi.");
  }
  if (!group) return failed("Grup jadwal yang dipilih tidak ditemukan.");

  const { error } = await admin.supabase.from("work_schedules").insert({
    name,
    start_time: startTime,
    end_time: endTime,
    description,
    group_id: group.id,
  });

  if (error) {
    console.error("Failed to create work schedule:", error);
    return failed(
      error.code === "23505"
        ? "Nama jam kerja tersebut sudah terdaftar."
        : "Jam kerja gagal disimpan."
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/data");
  return { status: "success", message: "Jam kerja berhasil ditambahkan." };
}

export async function createEmployeeAccount(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await verifyAdmin();
  if (!admin.ok) {
    return failed("Aksi ini hanya tersedia untuk admin.");
  }

  const email = readText(formData, "email", 254)?.toLowerCase();
  const passwordValue = formData.get("password");
  const password =
    typeof passwordValue === "string" ? passwordValue : "";
  const fullName = readText(formData, "full_name", 150);
  const employeeNumber = readText(formData, "employee_number", 50);
  const position = readText(formData, "position", 100);
  const unitId = readText(formData, "unit_id", 36);
  const groupId = readText(formData, "group_id", 36);
  const employeeStatus = readText(formData, "employee_status", 10);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return failed("Masukkan alamat email yang valid.");
  }
  if (password.length < 8 || password.length > 72) {
    return failed("Password harus terdiri dari 8–72 karakter.");
  }
  if (!fullName) return failed("Nama lengkap wajib diisi.");
  if (!unitId || !groupId) {
    return failed("Pilih unit kerja dan grup jadwal terlebih dahulu.");
  }
  if (employeeStatus !== "harian" && employeeStatus !== "shift") {
    return failed("Pilih status karyawan Harian atau Shift.");
  }

  if (!isAdminClientConfigured()) {
    return failed(
      "Pembuatan akun belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY ke environment server lalu mulai ulang aplikasi."
    );
  }

  const supabase = createAdminClient();
  const [
    { data: unit, error: unitError },
    { data: scheduleGroup, error: groupError },
  ] =
    await Promise.all([
      admin.supabase
        .from("work_units")
        .select("id, name")
        .eq("id", unitId)
        .maybeSingle(),
      admin.supabase
        .from("schedule_groups")
        .select("id, name")
        .eq("id", groupId)
        .maybeSingle(),
    ]);

  if (unitError || groupError) {
    console.error("Failed to validate employee unit or schedule group:", {
      unitError,
      groupError,
    });
    return failed("Data unit kerja atau jam kerja tidak dapat diverifikasi.");
  }
  if (!unit || !scheduleGroup) {
    return failed("Unit kerja atau grup jadwal yang dipilih tidak tersedia.");
  }

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createError || !created.user) {
    if (createError) console.error("Failed to create employee auth user:", createError);
    return failed(
      createError?.message.toLowerCase().includes("already")
        ? "Email tersebut sudah digunakan."
        : "Akun pengguna gagal dibuat."
    );
  }

  const { error: profileError } = await admin.supabase
    .from("employee_profiles")
    .insert({
      id: created.user.id,
      employee_number: employeeNumber,
      full_name: fullName,
      position,
      department: unit.name,
      shift_name: scheduleGroup.name,
      unit_id: unit.id,
      schedule_group_id: scheduleGroup.id,
      employee_status: employeeStatus,
    });

  if (profileError) {
    console.error("Failed to create employee profile; rolling back auth user:", profileError);
    const { error: rollbackError } = await supabase.auth.admin.deleteUser(
      created.user.id
    );
    if (rollbackError) {
      console.error("Failed to roll back orphaned employee auth user:", rollbackError);
      return failed(
        "Akun login berhasil dibuat, tetapi profil gagal disimpan dan akun tidak dapat dibersihkan. Hubungi administrator sistem."
      );
    }
    return failed("Profil karyawan gagal disimpan; akun login yang dibuat sudah dibatalkan.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/data");
  return {
    status: "success",
    message: "Akun dan data karyawan berhasil dibuat serta dipetakan.",
  };
}

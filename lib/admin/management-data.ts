import "server-only";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ManagementOption = {
  id: string;
  name: string;
};

export type ManagementEmployee = {
  id: string;
  full_name: string;
  employee_number: string | null;
  employee_status: "harian" | "shift";
  schedule_group_id: string | null;
};

export type AdminManagementData = {
  units: ManagementOption[];
  groups: ManagementOption[];
  employees: ManagementEmployee[];
  schedules: (ManagementOption & {
    start_time: string;
    end_time: string;
    group_id: string | null;
  })[];
  error: string | null;
};

export async function getAdminManagementData(): Promise<AdminManagementData> {
  await io();
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    if (authError) console.error("Failed to verify admin management session:", authError);
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("employee_profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to verify admin management role:", profileError);
    return {
      units: [],
      groups: [],
      employees: [],
      schedules: [],
      error: "Hak akses admin tidak dapat diverifikasi.",
    };
  }
  if (profile?.role !== "admin") redirect("/");

  const [unitsResult, schedulesResult, groupsResult, employeesResult] =
    await Promise.all([
    supabase.from("work_units").select("id, name").order("name"),
    supabase
      .from("work_schedules")
      .select("id, name, start_time, end_time, group_id")
      .order("name"),
    supabase.from("schedule_groups").select("id, name").order("name"),
    supabase
      .from("employee_profiles")
      .select(
        "id, full_name, employee_number, employee_status, schedule_group_id"
      )
      .eq("role", "karyawan")
      .order("full_name")
      .limit(1000),
  ]);

  if (
    unitsResult.error ||
    schedulesResult.error ||
    groupsResult.error ||
    employeesResult.error
  ) {
    console.error("Failed to load admin management options:", {
      unitsError: unitsResult.error,
      schedulesError: schedulesResult.error,
      groupsError: groupsResult.error,
      employeesError: employeesResult.error,
    });
    return {
      units: [],
      groups: [],
      employees: [],
      schedules: [],
      error: "Data unit kerja, grup, jam kerja, atau karyawan tidak dapat dimuat. Jalankan migrasi terbaru.",
    };
  }

  return {
    units: unitsResult.data ?? [],
    groups: groupsResult.data ?? [],
    employees: employeesResult.data ?? [],
    schedules: schedulesResult.data ?? [],
    error: null,
  };
}

import "server-only";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import {
  getExpectedTimestamp,
  minutesBetween,
} from "@/lib/admin/attendance-calculation";
import { createClient } from "@/lib/supabase/server";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxReportDays = 366;

export type AdminReportFilters = {
  from: string;
  to: string;
  unitId: string;
};

export type AdminReportUnit = {
  id: string;
  name: string;
};

export type AdminReportRow = {
  id: string;
  workDate: string;
  employeeNumber: string | null;
  employeeName: string;
  position: string | null;
  employeeStatus: "harian" | "shift";
  unitId: string | null;
  unitName: string;
  groupName: string;
  scheduleName: string;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  checkInAt: string;
  checkOutAt: string | null;
  status: string;
  lateMinutes: number | null;
  earlyLeaveMinutes: number | null;
};

export type AdminReportResult =
  | {
      error: null;
      filters: AdminReportFilters;
      units: AdminReportUnit[];
      rows: AdminReportRow[];
    }
  | {
      error: string;
      filters: AdminReportFilters;
      units: AdminReportUnit[];
      rows: [];
    };

function todayInAceh() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isValidDate(value: string) {
  if (!datePattern.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

function scheduleTime(value: string | null) {
  return value?.slice(0, 5) ?? null;
}

export async function getAdminReport(
  requested: Partial<AdminReportFilters>
): Promise<AdminReportResult> {
  await io();
  const today = todayInAceh();
  const filters: AdminReportFilters = {
    from: requested.from ?? today,
    to: requested.to ?? today,
    unitId: requested.unitId ?? "",
  };

  if (!isValidDate(filters.from) || !isValidDate(filters.to)) {
    return {
      error: "Rentang tanggal laporan tidak valid.",
      filters,
      units: [],
      rows: [],
    };
  }

  const dayCount =
    (Date.parse(`${filters.to}T00:00:00Z`) -
      Date.parse(`${filters.from}T00:00:00Z`)) /
      86_400_000 +
    1;
  if (dayCount < 1 || dayCount > maxReportDays) {
    return {
      error: "Rentang laporan harus maksimal 366 hari dan tanggal awal tidak boleh setelah tanggal akhir.",
      filters,
      units: [],
      rows: [],
    };
  }

  if (filters.unitId && !uuidPattern.test(filters.unitId)) {
    return {
      error: "Unit kerja yang dipilih tidak valid.",
      filters,
      units: [],
      rows: [],
    };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    if (authError) console.error("Failed to verify admin report session:", authError);
    redirect("/login");
  }

  const { data: adminProfile, error: roleError } = await supabase
    .from("employee_profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (roleError) {
    console.error("Failed to verify admin role for report:", roleError);
    return {
      error: "Hak akses admin tidak dapat diverifikasi.",
      filters,
      units: [],
      rows: [],
    };
  }
  if (adminProfile?.role !== "admin") redirect("/");

  const [
    unitsResult,
    schedulesResult,
    groupsResult,
    employeesResult,
  ] = await Promise.all([
    supabase.from("work_units").select("id, name").order("name"),
    supabase
      .from("work_schedules")
      .select("id, name, start_time, end_time, group_id"),
    supabase.from("schedule_groups").select("id, name"),
    supabase
      .from("employee_profiles")
      .select(
        "id, employee_number, full_name, position, unit_id, work_schedule_id, schedule_group_id, employee_status"
      )
      .eq("role", "karyawan")
      .order("full_name")
      .range(0, 999),
  ]);

  if (
    unitsResult.error ||
    schedulesResult.error ||
    groupsResult.error ||
    employeesResult.error
  ) {
    console.error("Failed to load admin report metadata:", {
      unitsError: unitsResult.error,
      schedulesError: schedulesResult.error,
      groupsError: groupsResult.error,
      employeesError: employeesResult.error,
    });
    return {
      error: "Data unit, grup, jadwal, atau karyawan laporan tidak dapat dimuat.",
      filters,
      units: [],
      rows: [],
    };
  }

  const units = unitsResult.data ?? [];
  const employees = [...(employeesResult.data ?? [])];
  if (employeesResult.data && employeesResult.data.length === 1000) {
    for (let offset = 1000; ; offset += 1000) {
      const { data, error } = await supabase
        .from("employee_profiles")
        .select(
          "id, employee_number, full_name, position, unit_id, work_schedule_id, schedule_group_id, employee_status"
        )
        .eq("role", "karyawan")
        .order("full_name")
        .range(offset, offset + 999);
      if (error) {
        console.error("Failed to load all employees for report:", error);
        return {
          error: "Data karyawan laporan tidak dapat dimuat seluruhnya.",
          filters,
          units,
          rows: [],
        };
      }
      employees.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
  }
  const unitById = new Map(units.map((unit) => [unit.id, unit.name]));
  const groupById = new Map(
    (groupsResult.data ?? []).map((group) => [group.id, group.name])
  );
  const scheduleById = new Map(
    (schedulesResult.data ?? []).map((schedule) => [
      schedule.id,
      {
        name: schedule.name,
        start: scheduleTime(schedule.start_time),
        end: scheduleTime(schedule.end_time),
        groupId: schedule.group_id,
      },
    ])
  );
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

  if (filters.unitId && !unitById.has(filters.unitId)) {
    return {
      error: "Unit kerja yang dipilih tidak ditemukan.",
      filters,
      units,
      rows: [],
    };
  }

  const attendance = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("id, user_id, work_date, check_in_at, check_out_at, schedule_id, status")
      .gte("work_date", filters.from)
      .lte("work_date", filters.to)
      .order("work_date", { ascending: false })
      .order("check_in_at", { ascending: false })
      .range(offset, offset + 999);

    if (error) {
      console.error("Failed to load admin attendance report records:", error);
      return {
        error: "Catatan presensi pada rentang tersebut tidak dapat dimuat.",
        filters,
        units,
        rows: [],
      };
    }
    attendance.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const rows: AdminReportRow[] = [];
  for (const record of attendance) {
    const employee = employeeById.get(record.user_id);
    if (!employee || (filters.unitId && employee.unit_id !== filters.unitId)) {
      continue;
    }

    const schedule = record.schedule_id
      ? scheduleById.get(record.schedule_id)
      : employee.work_schedule_id
        ? scheduleById.get(employee.work_schedule_id)
        : undefined;
    const expectedStart =
      schedule?.start && schedule?.end
        ? getExpectedTimestamp(record.work_date, schedule.start)
        : null;
    const crossesMidnight =
      !!schedule?.start &&
      !!schedule?.end &&
      schedule.end <= schedule.start;
    const expectedEnd =
      schedule?.end && schedule?.start
        ? getExpectedTimestamp(record.work_date, schedule.end, crossesMidnight)
        : null;
    const checkIn = Date.parse(record.check_in_at);
    const checkOut = record.check_out_at
      ? Date.parse(record.check_out_at)
      : null;

    rows.push({
      id: record.id,
      workDate: record.work_date,
      employeeNumber: employee.employee_number,
      employeeName: employee.full_name,
      position: employee.position,
      employeeStatus: employee.employee_status,
      unitId: employee.unit_id,
      unitName: employee.unit_id
        ? unitById.get(employee.unit_id) ?? "Unit tidak ditemukan"
        : "Belum ditentukan",
      groupName: employee.schedule_group_id
        ? groupById.get(employee.schedule_group_id) ?? "Grup tidak ditemukan"
        : schedule?.groupId
          ? groupById.get(schedule.groupId) ?? "Grup tidak ditemukan"
          : "Belum ditentukan",
      scheduleName: schedule?.name ?? "Jadwal mengikuti grup",
      scheduleStart: schedule?.start ?? null,
      scheduleEnd: schedule?.end ?? null,
      checkInAt: record.check_in_at,
      checkOutAt: record.check_out_at,
      status: record.status,
      lateMinutes:
        expectedStart === null
          ? null
          : minutesBetween(checkIn, expectedStart),
      earlyLeaveMinutes:
        expectedEnd === null || checkOut === null
          ? null
          : minutesBetween(expectedEnd, checkOut),
    });
  }

  return { error: null, filters, units, rows };
}

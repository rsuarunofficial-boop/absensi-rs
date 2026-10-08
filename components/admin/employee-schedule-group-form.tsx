"use client";

import { useActionState } from "react";
import {
  updateEmployeeScheduleGroup,
  type AdminActionState,
} from "@/lib/admin/actions";
import type {
  ManagementEmployee,
  ManagementOption,
} from "@/lib/admin/management-data";

const initialState: AdminActionState = { status: "idle", message: "" };

export function EmployeeScheduleGroupForm({
  employee,
  groups,
}: {
  employee: ManagementEmployee;
  groups: ManagementOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    updateEmployeeScheduleGroup,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
      <input name="employee_id" type="hidden" value={employee.id} />
      <div>
        <p className="text-sm font-semibold text-slate-800">{employee.full_name}</p>
        <p className="text-xs text-slate-500">
          {employee.employee_number ?? "Tanpa nomor pegawai"}
        </p>
      </div>
      <div>
        <label
          className="mb-1 block text-xs font-medium text-slate-600"
          htmlFor={`employee-status-${employee.id}`}
        >
          Status karyawan
        </label>
        <select
          className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm"
          defaultValue={employee.employee_status}
          id={`employee-status-${employee.id}`}
          name="employee_status"
          required
        >
          <option value="harian">Harian</option>
          <option value="shift">Shift</option>
        </select>
      </div>
      <div>
        <label
          className="mb-1 block text-xs font-medium text-slate-600"
          htmlFor={`employee-group-${employee.id}`}
        >
          Grup jadwal
        </label>
        <select
          className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm"
          defaultValue={employee.schedule_group_id ?? ""}
          id={`employee-group-${employee.id}`}
          name="group_id"
          required
        >
          <option disabled value="">Pilih grup</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>
      <button
        className="min-h-10 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
        disabled={isPending || !groups.length}
        type="submit"
      >
        {isPending ? "Menyimpan..." : "Simpan"}
      </button>
      {state.status !== "idle" && (
        <p
          className={`text-xs sm:col-span-4 ${
            state.status === "error" ? "text-rose-700" : "text-emerald-700"
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

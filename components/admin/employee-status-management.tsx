"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  deleteEmployee,
  resetEmployeePassword,
  updateEmployeeManagement,
  type AdminActionState,
} from "@/lib/admin/actions";
import type {
  ManagementEmployee,
  ManagementOption,
} from "@/lib/admin/management-data";

const initialState: AdminActionState = { status: "idle", message: "" };
const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
const employmentStatuses = [
  { value: "aktif", label: "Aktif" },
  { value: "nonaktif", label: "Nonaktif" },
  { value: "suspend", label: "Suspend" },
  { value: "cuti", label: "Cuti" },
  { value: "kontrak", label: "Kontrak" },
] as const;

type EmployeeStatusManagementProps = {
  employees: ManagementEmployee[];
  units: ManagementOption[];
  groups: ManagementOption[];
};

function ActionMessage({ state }: { state: AdminActionState }) {
  if (state.status === "idle") return null;
  return (
    <p
      className={`rounded-xl px-3 py-2 text-sm ${
        state.status === "error"
          ? "bg-rose-50 text-rose-800"
          : "bg-emerald-50 text-emerald-800"
      }`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function EmployeeEditDialog({
  employee,
  units,
  groups,
  onClose,
  onSaved,
}: {
  employee: ManagementEmployee;
  units: ManagementOption[];
  groups: ManagementOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [editState, editAction, editPending] = useActionState(
    updateEmployeeManagement,
    initialState
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    resetEmployeePassword,
    initialState
  );
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editState.status === "success") {
      onSaved(editState.message);
      onClose();
    }
  }, [editState, onClose, onSaved]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <section
        aria-labelledby="employee-edit-title"
        aria-modal="true"
        className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900" id="employee-edit-title">
              Edit Karyawan
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {employee.full_name} · {employee.employee_number ?? "Tanpa NIK"}
            </p>
          </div>
          <button
            aria-label="Tutup dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form action={editAction} className="mt-5 space-y-4">
          <input name="employee_id" type="hidden" value={employee.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="edit-employment-status">
                Status karyawan
              </label>
              <select
                className={inputClass}
                defaultValue={employee.employment_status}
                id="edit-employment-status"
                name="employment_status"
                required
              >
                {employmentStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-schedule-type">
                Tipe jadwal
              </label>
              <select
                className={inputClass}
                defaultValue={employee.employee_status}
                id="edit-schedule-type"
                name="employee_status"
                required
              >
                <option value="harian">Harian</option>
                <option value="shift">Shift</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-schedule-group">
                Grup jadwal
              </label>
              <select
                className={inputClass}
                defaultValue={employee.schedule_group_id ?? ""}
                id="edit-schedule-group"
                name="group_id"
                required
              >
                <option disabled value="">Pilih grup jadwal</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-work-unit">
                Unit kerja
              </label>
              <select
                className={inputClass}
                defaultValue={employee.unit_id ?? ""}
                id="edit-work-unit"
                name="unit_id"
                required
              >
                <option disabled value="">Pilih unit kerja</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
          </div>
          {!groups.length || !units.length ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Tambahkan unit kerja dan grup jadwal sebelum mengubah data karyawan.
            </p>
          ) : null}
          <ActionMessage state={editState} />
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
              disabled={editPending || !groups.length || !units.length}
              type="submit"
            >
              {editPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>

        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Reset password</h4>
              <p className="mt-1 text-xs text-slate-500">
                Atur password baru untuk akun karyawan ini.
              </p>
            </div>
            <button
              aria-expanded={showPasswordReset}
              className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setShowPasswordReset((visible) => !visible)}
              type="button"
            >
              {showPasswordReset ? "Batal reset" : "Reset Password"}
            </button>
          </div>
          {showPasswordReset ? (
            <form action={passwordAction} className="mt-4 space-y-3">
              <input name="employee_id" type="hidden" value={employee.id} />
              <label className={labelClass} htmlFor="employee-new-password">
                Password baru
              </label>
              <div className="flex gap-2">
                <input
                  autoComplete="new-password"
                  className={inputClass}
                  id="employee-new-password"
                  maxLength={72}
                  minLength={8}
                  name="new_password"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="shrink-0 rounded-xl border border-slate-300 px-3 text-sm text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
              <p className="text-xs text-slate-500">Gunakan 8–72 karakter.</p>
              <ActionMessage state={passwordState} />
              <button
                className="min-h-10 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-wait disabled:opacity-60"
                disabled={passwordPending}
                type="submit"
              >
                {passwordPending ? "Mereset..." : "Simpan Password Baru"}
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function EmployeeDeleteDialog({
  employee,
  onClose,
  onDeleted,
}: {
  employee: ManagementEmployee;
  onClose: () => void;
  onDeleted: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(deleteEmployee, initialState);

  useEffect(() => {
    if (state.status === "success") {
      onDeleted(state.message);
      onClose();
    }
  }, [state, onClose, onDeleted]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <section
        aria-labelledby="employee-delete-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
      >
        <h3 className="text-lg font-bold text-slate-900" id="employee-delete-title">
          Hapus karyawan?
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Akun <strong>{employee.full_name}</strong> dan data presensinya akan
          dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <form action={action} className="mt-5 space-y-4">
          <input name="employee_id" type="hidden" value={employee.id} />
          <ActionMessage state={state} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="min-h-11 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Menghapus..." : "Ya, hapus karyawan"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function EmployeeStatusManagement({
  employees,
  units,
  groups,
}: EmployeeStatusManagementProps) {
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [editingEmployee, setEditingEmployee] =
    useState<ManagementEmployee | null>(null);
  const [deletingEmployee, setDeletingEmployee] =
    useState<ManagementEmployee | null>(null);
  const [notice, setNotice] = useState("");

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("id");
    return employees.filter((employee) => {
      const matchesName = employee.full_name
        .toLocaleLowerCase("id")
        .includes(normalizedSearch);
      const matchesUnit = !unitFilter || employee.unit_id === unitFilter;
      return matchesName && matchesUnit;
    });
  }, [employees, search, unitFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const firstEntry = filteredEmployees.length
    ? (currentPage - 1) * pageSize + 1
    : 0;
  const lastEntry = Math.min(currentPage * pageSize, filteredEmployees.length);
  const allVisibleSelected =
    pageEmployees.length > 0 &&
    pageEmployees.every((employee) => selectedIds.has(employee.id));

  function toggleEmployee(employeeId: string) {
    setSelectedIds((current) => {
      const updated = new Set(current);
      if (updated.has(employeeId)) updated.delete(employeeId);
      else updated.add(employeeId);
      return updated;
    });
  }

  function toggleVisibleEmployees() {
    setSelectedIds((current) => {
      const updated = new Set(current);
      if (allVisibleSelected) {
        pageEmployees.forEach((employee) => updated.delete(employee.id));
      } else {
        pageEmployees.forEach((employee) => updated.add(employee.id));
      }
      return updated;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Status karyawan</h3>
          <p className="mt-1 text-sm text-slate-500">
            Cari, filter, dan kelola status, unit, grup jadwal, serta akun karyawan.
          </p>
        </div>
        <p className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          {filteredEmployees.length} dari {employees.length} karyawan
        </p>
      </div>

      {notice ? (
        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {notice}
          <button
            aria-label="Tutup notifikasi"
            className="text-lg leading-none"
            onClick={() => setNotice("")}
            type="button"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_15rem]">
        <label className="relative block">
          <span className="sr-only">Cari nama karyawan</span>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            className={`${inputClass} pl-10`}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Cari nama karyawan..."
            type="search"
            value={search}
          />
        </label>
        <label>
          <span className="sr-only">Filter unit kerja</span>
          <select
            className={inputClass}
            onChange={(event) => {
              setUnitFilter(event.target.value);
              setPage(1);
            }}
            value={unitFilter}
          >
            <option value="">Semua unit kerja</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-16 px-4 py-3 font-semibold" scope="col">
                  <span className="sr-only">Pilih</span>
                  <input
                    aria-label="Pilih semua karyawan di halaman ini"
                    checked={allVisibleSelected}
                    className="h-4 w-4 rounded border-slate-300 accent-emerald-700"
                    onChange={toggleVisibleEmployees}
                    type="checkbox"
                  />
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">Nama karyawan &amp; NIK</th>
                <th className="px-4 py-3 font-semibold" scope="col">Unit kerja</th>
                <th className="px-4 py-3 font-semibold" scope="col">Grup jadwal</th>
                <th className="px-4 py-3 font-semibold" scope="col">Status karyawan</th>
                <th className="px-4 py-3 text-right font-semibold" scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageEmployees.map((employee, index) => {
                const status = employmentStatuses.find(
                  (option) => option.value === employee.employment_status
                );
                const statusColors: Record<string, string> = {
                  aktif: "bg-emerald-50 text-emerald-700",
                  nonaktif: "bg-slate-100 text-slate-600",
                  suspend: "bg-rose-50 text-rose-700",
                  cuti: "bg-amber-50 text-amber-700",
                  kontrak: "bg-sky-50 text-sky-700",
                };
                return (
                  <tr
                    className="transition-colors hover:bg-slate-50"
                    key={employee.id}
                  >
                    <td className="px-4 py-3.5 text-slate-500">
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={`Pilih ${employee.full_name}`}
                          checked={selectedIds.has(employee.id)}
                          className="h-4 w-4 rounded border-slate-300 accent-emerald-700"
                          onChange={() => toggleEmployee(employee.id)}
                          type="checkbox"
                        />
                        <span className="w-4 tabular-nums">
                          {(currentPage - 1) * pageSize + index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{employee.full_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {employee.employee_number ?? "Tanpa NIK"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {units.find((unit) => unit.id === employee.unit_id)?.name ??
                        "Belum ditentukan"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {groups.find((group) => group.id === employee.schedule_group_id)
                        ?.name ?? (employee.employee_status === "harian" ? "Harian" : "Belum ditentukan")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusColors[employee.employment_status] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {status?.label ?? employee.employment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                          onClick={() => setEditingEmployee(employee)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          onClick={() => setDeletingEmployee(employee)}
                          type="button"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!pageEmployees.length ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={6}>
                    {employees.length
                      ? "Tidak ada karyawan yang sesuai dengan pencarian atau filter."
                      : "Belum ada data karyawan."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>
            Showing {firstEntry}-{lastEntry} of {filteredEmployees.length} entries
          </span>
          {selectedIds.size ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
              {selectedIds.size} dipilih
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Baris
            <select
              className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              value={pageSize}
            >
              {[10, 50, 100].map((limit) => (
                <option key={limit} value={limit}>{limit}</option>
              ))}
            </select>
          </label>
          <nav aria-label="Navigasi halaman karyawan" className="flex items-center gap-1">
            <button
              aria-label="Halaman sebelumnya"
              className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Previous
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1)
              .filter((number) => (
                number === 1 ||
                number === pageCount ||
                Math.abs(number - currentPage) <= 1
              ))
              .map((number, index, visiblePages) => (
                <span className="contents" key={number}>
                  {index > 0 && number - visiblePages[index - 1] > 1 ? (
                    <span aria-hidden="true" className="px-1 text-slate-400">…</span>
                  ) : null}
                  <button
                    aria-current={currentPage === number ? "page" : undefined}
                    aria-label={`Halaman ${number}`}
                    className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium ${
                      currentPage === number
                        ? "bg-emerald-700 text-white"
                        : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setPage(number)}
                    type="button"
                  >
                    {number}
                  </button>
                </span>
              ))}
            <button
              aria-label="Halaman berikutnya"
              className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              type="button"
            >
              Next
            </button>
          </nav>
        </div>
      </div>

      {editingEmployee ? (
        <EmployeeEditDialog
          employee={editingEmployee}
          groups={groups}
          key={editingEmployee.id}
          onClose={() => setEditingEmployee(null)}
          onSaved={setNotice}
          units={units}
        />
      ) : null}
      {deletingEmployee ? (
        <EmployeeDeleteDialog
          employee={deletingEmployee}
          key={deletingEmployee.id}
          onClose={() => setDeletingEmployee(null)}
          onDeleted={setNotice}
        />
      ) : null}
    </section>
  );
}

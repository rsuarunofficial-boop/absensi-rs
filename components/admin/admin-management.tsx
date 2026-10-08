"use client";

import { useActionState, useState } from "react";
import {
  createScheduleGroup,
  createEmployeeAccount,
  createWorkSchedule,
  createWorkUnit,
  mapScheduleToGroup,
  type AdminActionState,
} from "@/lib/admin/actions";
import type { AdminManagementData } from "@/lib/admin/management-data";
import { EmployeeScheduleGroupForm } from "@/components/admin/employee-schedule-group-form";

const initialState: AdminActionState = { status: "idle", message: "" };

function FormStatus({ state }: { state: AdminActionState }) {
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

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
const buttonClass =
  "min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60";

export function AdminManagement({ data }: { data: AdminManagementData }) {
  const [activeTab, setActiveTab] = useState<
    "employees" | "employee-groups" | "units" | "schedules" | "groups"
  >("employees");
  const [employeeGroupId, setEmployeeGroupId] = useState("");
  const [employeeState, employeeAction, employeePending] = useActionState(
    createEmployeeAccount,
    initialState
  );
  const [unitState, unitAction, unitPending] = useActionState(
    createWorkUnit,
    initialState
  );
  const [scheduleState, scheduleAction, schedulePending] = useActionState(
    createWorkSchedule,
    initialState
  );
  const [groupState, groupAction, groupPending] = useActionState(
    createScheduleGroup,
    initialState
  );
  const [mappingState, mappingAction, mappingPending] = useActionState(
    mapScheduleToGroup,
    initialState
  );

  if (data.error) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
        {data.error}
      </p>
    );
  }

  const tabs = [
    { id: "employees", label: "Data karyawan" },
    { id: "employee-groups", label: "Status karyawan" },
    { id: "units", label: "Unit kerja" },
    { id: "groups", label: "Grup jadwal" },
    { id: "schedules", label: "Jam kerja" },
  ] as const;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900">Kelola data admin</h2>
        <p className="mt-1 text-sm text-slate-500">
          Buat akun karyawan dan petakan ke unit kerja serta jam kerja.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Modul admin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              aria-selected={activeTab === tab.id}
              className={`min-h-10 rounded-xl px-4 text-sm font-semibold ${
                activeTab === tab.id
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {activeTab === "employees" && (
          <form action={employeeAction} className="grid gap-4 sm:grid-cols-2">
            {(!data.units.length || !data.groups.length) && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">
                Tambahkan minimal satu unit kerja dan satu grup jadwal sebelum
                membuat data karyawan.
              </p>
            )}
            <div>
              <label className={labelClass} htmlFor="employee-full-name">Nama lengkap</label>
              <input className={inputClass} id="employee-full-name" name="full_name" required maxLength={150} />
            </div>
            <div>
              <label className={labelClass} htmlFor="employee-number">Nomor pegawai</label>
              <input className={inputClass} id="employee-number" name="employee_number" maxLength={50} />
            </div>
            <div>
              <label className={labelClass} htmlFor="employee-position">Jabatan</label>
              <input className={inputClass} id="employee-position" name="position" maxLength={100} />
            </div>
            <div>
              <label className={labelClass} htmlFor="employee-email">Email akun</label>
              <input autoComplete="off" className={inputClass} id="employee-email" name="email" required type="email" maxLength={254} />
            </div>
            <div>
              <label className={labelClass} htmlFor="employee-password">Password awal</label>
              <input autoComplete="new-password" className={inputClass} id="employee-password" name="password" required type="password" minLength={8} maxLength={72} />
              <p className="mt-1 text-xs text-slate-500">Minimal 8 karakter. Password hanya dikirim ke Supabase Auth.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="employee-unit">Unit kerja</label>
              <select className={inputClass} defaultValue="" id="employee-unit" name="unit_id" required>
                <option disabled value="">Pilih unit kerja</option>
                {data.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="employee-group">Grup jadwal</label>
              <select
                className={inputClass}
                id="employee-group"
                name="group_id"
                onChange={(event) => {
                  setEmployeeGroupId(event.target.value);
                }}
                required
                value={employeeGroupId}
              >
                <option disabled value="">Pilih grup jadwal</option>
                {data.groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="employee-status">Status karyawan</label>
              <select
                className={inputClass}
                defaultValue=""
                id="employee-status"
                name="employee_status"
                required
              >
                <option disabled value="">Pilih status karyawan</option>
                <option value="harian">Harian</option>
                <option value="shift">Shift</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                className={buttonClass}
                disabled={
                  employeePending ||
                  !data.units.length ||
                  !data.groups.length
                }
                type="submit"
              >
                {employeePending ? "Menyimpan..." : "Buat akun dan data karyawan"}
              </button>
            </div>
            <div className="sm:col-span-2"><FormStatus state={employeeState} /></div>
          </form>
        )}

        {activeTab === "groups" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form action={groupAction} className="space-y-4">
              <h3 className="font-semibold text-slate-900">Buat grup jadwal</h3>
              <div>
                <label className={labelClass} htmlFor="group-name">Nama grup</label>
                <input
                  className={inputClass}
                  id="group-name"
                  name="name"
                  placeholder="Contoh: Perawat Shift"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="group-description">Keterangan (opsional)</label>
                <textarea className={`${inputClass} py-3`} id="group-description" name="description" rows={3} maxLength={500} />
              </div>
              <button className={buttonClass} disabled={groupPending} type="submit">
                {groupPending ? "Menyimpan..." : "Tambah grup"}
              </button>
              <FormStatus state={groupState} />
            </form>

            <form action={mappingAction} className="space-y-4">
              <h3 className="font-semibold text-slate-900">Petakan jam kerja ke grup</h3>
              <p className="text-sm text-slate-500">
                Jadwal yang dipetakan dapat dipilih saat admin menetapkan grup karyawan.
              </p>
              <div>
                <label className={labelClass} htmlFor="mapping-schedule">Jam kerja</label>
                <select className={inputClass} defaultValue="" id="mapping-schedule" name="schedule_id" required>
                  <option disabled value="">Pilih jam kerja</option>
                  {data.schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name} ({schedule.start_time.slice(0, 5)}–{schedule.end_time.slice(0, 5)})
                      {schedule.group_id
                        ? ` · ${data.groups.find((group) => group.id === schedule.group_id)?.name ?? "Sudah dipetakan"}`
                        : " · Belum dipetakan"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="mapping-group">Grup jadwal</label>
                <select className={inputClass} defaultValue="" id="mapping-group" name="group_id" required>
                  <option disabled value="">Pilih grup</option>
                  {data.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              </div>
              <button className={buttonClass} disabled={mappingPending || !data.groups.length || !data.schedules.length} type="submit">
                {mappingPending ? "Menyimpan..." : "Simpan pemetaan"}
              </button>
              <FormStatus state={mappingState} />
            </form>

            <div className="lg:col-span-2">
              <h3 className="font-semibold text-slate-900">Grup dan jam kerja</h3>
              {data.groups.length ? (
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {data.groups.map((group) => (
                    <article className="rounded-xl border border-slate-200 p-4" key={group.id}>
                      <h4 className="font-semibold text-slate-800">{group.name}</h4>
                      <ul className="mt-2 divide-y divide-slate-100">
                        {data.schedules.filter((schedule) => schedule.group_id === group.id).map((schedule) => (
                          <li className="py-2 text-sm text-slate-600" key={schedule.id}>
                            {schedule.name} · {schedule.start_time.slice(0, 5)}–{schedule.end_time.slice(0, 5)}
                          </li>
                        ))}
                      </ul>
                      {!data.schedules.some((schedule) => schedule.group_id === group.id) && (
                        <p className="mt-2 text-sm text-slate-500">Belum ada jadwal pada grup ini.</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Belum ada grup jadwal.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "employee-groups" && (
          <div>
            <h3 className="font-semibold text-slate-900">
              Status dan grup jadwal karyawan
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Atur karyawan lama ke status Harian atau Shift dan tentukan grup
              jadwalnya. Karyawan berstatus Shift akan melihat pilihan shift
              dari grup ini saat cek in.
            </p>
            {!data.groups.length && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                Buat grup jadwal terlebih dahulu.
              </p>
            )}
            {data.employees.length ? (
              <div className="mt-4 space-y-3">
                {data.employees.map((employee) => (
                  <EmployeeScheduleGroupForm
                    employee={employee}
                    groups={data.groups}
                    key={employee.id}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Belum ada data karyawan.
              </p>
            )}
          </div>
        )}

        {activeTab === "units" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form action={unitAction} className="space-y-4">
              <h3 className="font-semibold text-slate-900">Tambah unit kerja</h3>
              <div>
                <label className={labelClass} htmlFor="unit-name">Nama unit</label>
                <input className={inputClass} id="unit-name" name="name" required maxLength={100} />
              </div>
              <div>
                <label className={labelClass} htmlFor="unit-description">Keterangan (opsional)</label>
                <textarea className={`${inputClass} py-3`} id="unit-description" name="description" rows={3} maxLength={500} />
              </div>
              <button className={buttonClass} disabled={unitPending} type="submit">
                {unitPending ? "Menyimpan..." : "Tambah unit kerja"}
              </button>
              <FormStatus state={unitState} />
            </form>
            <div>
              <h3 className="font-semibold text-slate-900">Unit terdaftar</h3>
              {data.units.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {data.units.map((unit) => <li className="py-3 text-sm text-slate-700" key={unit.id}>{unit.name}</li>)}
                </ul>
              ) : <p className="mt-3 text-sm text-slate-500">Belum ada unit kerja.</p>}
            </div>
          </div>
        )}

        {activeTab === "schedules" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form action={scheduleAction} className="space-y-4">
              <h3 className="font-semibold text-slate-900">Tambah jam kerja</h3>
              <div>
                <label className={labelClass} htmlFor="schedule-name">Nama jadwal</label>
                <input className={inputClass} id="schedule-name" name="name" required maxLength={100} placeholder="Contoh: Shift Pagi" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="schedule-start">Jam mulai</label>
                  <input className={inputClass} id="schedule-start" name="start_time" required type="time" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="schedule-end">Jam selesai</label>
                  <input className={inputClass} id="schedule-end" name="end_time" required type="time" />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="schedule-group">Grup jadwal</label>
                <select className={inputClass} defaultValue="" id="schedule-group" name="group_id" required>
                  <option disabled value="">Pilih grup jadwal</option>
                  {data.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="schedule-description">Keterangan (opsional)</label>
                <textarea className={`${inputClass} py-3`} id="schedule-description" name="description" rows={3} maxLength={500} />
              </div>
              <button className={buttonClass} disabled={schedulePending || !data.groups.length} type="submit">
                {schedulePending ? "Menyimpan..." : "Tambah jam kerja"}
              </button>
              <FormStatus state={scheduleState} />
            </form>
            <div>
              <h3 className="font-semibold text-slate-900">Jadwal terdaftar</h3>
              {data.schedules.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {data.schedules.map((schedule) => (
                    <li className="py-3" key={schedule.id}>
                      <p className="text-sm font-semibold text-slate-800">{schedule.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {schedule.start_time.slice(0, 5)}–{schedule.end_time.slice(0, 5)}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">
                        {data.groups.find((group) => group.id === schedule.group_id)?.name ?? "Belum dipetakan ke grup"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-sm text-slate-500">Belum ada jam kerja.</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

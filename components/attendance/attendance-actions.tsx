"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  checkInAttendance,
  checkOutAttendance,
} from "@/lib/attendance/actions";
import type {
  AttendanceActionState,
  AttendanceRecord,
  EmployeeWorkSchedule,
} from "@/lib/attendance/data";

const initialState: AttendanceActionState = {
  status: "idle",
  message: "",
};

function actionMessage(state: AttendanceActionState) {
  if (state.status === "idle") return null;

  return (
    <p
      className={`mt-3 text-sm ${
        state.status === "error" ? "text-rose-700" : "text-emerald-700"
      }`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

export function AttendanceActions({
  attendance,
  canAttend,
  employeeStatus,
  schedules,
  scheduleError,
}: {
  attendance: AttendanceRecord | null;
  canAttend: boolean;
  employeeStatus: "harian" | "shift" | null;
  schedules: EmployeeWorkSchedule[];
  scheduleError: string | null;
}) {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const scheduleDialogRef = useRef<HTMLDialogElement>(null);
  const [checkInState, checkInFormAction, isCheckingIn] = useActionState(
    checkInAttendance,
    initialState
  );
  const [checkOutState, checkOutFormAction, isCheckingOut] = useActionState(
    checkOutAttendance,
    initialState
  );

  const canCheckIn = canAttend && !attendance;
  const canCheckOut = canAttend && !!attendance && !attendance.check_out_at;
  const needsScheduleChoice = employeeStatus === "shift";
  const canSubmitCheckIn =
    canCheckIn &&
    (!needsScheduleChoice || (!scheduleError && schedules.length > 0));

  useEffect(() => {
    const dialog = scheduleDialogRef.current;
    if (!dialog) return;

    if (isScheduleDialogOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isScheduleDialogOpen && dialog.open) {
      dialog.close();
    }
  }, [isScheduleDialogOpen]);

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-3">
        <form action={checkInFormAction}>
          {needsScheduleChoice ? (
            <button
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-2.5 text-left text-white shadow-sm shadow-emerald-800/15 transition hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 sm:gap-2.5 sm:px-3"
              disabled={!canCheckIn || isCheckingIn}
              onClick={() => setIsScheduleDialogOpen(true)}
              type="button"
            >
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10 17l5-5-5-5m5 5H3m11-9h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold">
                  {isCheckingIn ? "Menyimpan..." : "Cek In"}
                </span>
                <span className="block text-[9px] text-emerald-50">
                  Mulai Jam Kerja
                </span>
              </span>
            </button>
          ) : (
            <button
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-2.5 text-left text-white shadow-sm shadow-emerald-800/15 transition hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 sm:gap-2.5 sm:px-3"
              disabled={!canSubmitCheckIn || isCheckingIn}
              type="submit"
            >
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10 17l5-5-5-5m5 5H3m11-9h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold">
                  {isCheckingIn ? "Menyimpan..." : "Cek In"}
                </span>
                <span className="block text-[9px] text-emerald-50">
                  Mulai Jam Kerja
                </span>
              </span>
            </button>
          )}
          {needsScheduleChoice && (
            <dialog
              aria-labelledby="attendance-schedule-title"
              className="m-auto max-h-[min(88vh,760px)] w-[min(92vw,520px)] overflow-y-auto rounded-3xl border-0 bg-transparent p-0 shadow-2xl backdrop:bg-slate-950/60"
              onCancel={(event) => {
                event.preventDefault();
                setIsScheduleDialogOpen(false);
              }}
              onClose={() => setIsScheduleDialogOpen(false)}
              ref={scheduleDialogRef}
            >
              <div className="overflow-hidden rounded-3xl bg-white">
                <div className="bg-gradient-to-br from-emerald-800 to-teal-700 px-5 pb-6 pt-5 text-white sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                        Presensi karyawan shift
                      </p>
                      <h2
                        className="mt-2 text-xl font-bold"
                        id="attendance-schedule-title"
                      >
                        Pilih jam kerja
                      </h2>
                      <p className="mt-1 text-sm text-emerald-100">
                        Pilih shift yang Anda jalankan hari ini.
                      </p>
                    </div>
                    <button
                      aria-label="Tutup pilihan jam kerja"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25"
                      onClick={() => setIsScheduleDialogOpen(false)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                  {scheduleError ? (
                    <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800" role="alert">
                      {scheduleError}
                    </p>
                  ) : schedules.length ? (
                    schedules.map((schedule) => {
                      const isSelected = selectedScheduleId === schedule.id;
                      return (
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100"
                              : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                          }`}
                          key={schedule.id}
                        >
                          <input
                            checked={isSelected}
                            className="h-5 w-5 accent-emerald-700"
                            name="schedule_id"
                            onChange={() => setSelectedScheduleId(schedule.id)}
                            type="radio"
                            value={schedule.id}
                          />
                          <span
                            aria-hidden="true"
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              isSelected
                                ? "bg-emerald-700 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {schedule.start_time.slice(0, 5)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-slate-900">
                              {schedule.name}
                            </span>
                            <span className="mt-0.5 block text-sm text-slate-500">
                              {schedule.start_time.slice(0, 5)}–
                              {schedule.end_time.slice(0, 5)} WIB
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? "border-emerald-700 bg-emerald-700 text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                      Belum ada jam kerja yang dipetakan ke grup Anda. Hubungi
                      administrator.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <button
                      className="min-h-12 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={() => setIsScheduleDialogOpen(false)}
                      type="button"
                    >
                      Batal
                    </button>
                    <button
                      className="min-h-12 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      disabled={!selectedScheduleId || isCheckingIn}
                      onClick={() => setIsScheduleDialogOpen(false)}
                      type="submit"
                    >
                      {isCheckingIn ? "Menyimpan..." : "Konfirmasi Cek In"}
                    </button>
                  </div>
                  {actionMessage(checkInState)}
                </div>
              </div>
            </dialog>
          )}
        </form>
        <form action={checkOutFormAction}>
          <button
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-2.5 text-left text-white shadow-sm shadow-rose-800/15 transition hover:from-rose-600 hover:to-red-600 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 sm:gap-2.5 sm:px-3"
            disabled={!canCheckOut || isCheckingOut}
            type="submit"
          >
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 7l-5 5 5 5m-5-5h12M10 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h4" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold">
                {isCheckingOut ? "Menyimpan..." : "Cek Out"}
              </span>
              <span className="block text-[9px] text-rose-50">
                Akhiri Jam Kerja
              </span>
            </span>
          </button>
        </form>
      </div>
      {actionMessage(checkInState)}
      {actionMessage(checkOutState)}
      {!canAttend && (
        <p className="mt-3 text-sm text-slate-500">
          Presensi hanya tersedia untuk akun karyawan dengan data yang aktif.
        </p>
      )}
    </div>
  );
}

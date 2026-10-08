"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  AdminReportFilters,
  AdminReportResult,
  AdminReportRow,
} from "@/lib/admin/report-data";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00+07:00`));
}

function formatTime(value: string | null) {
  return value ? `${timeFormatter.format(new Date(value))} WIB` : "Belum cek out";
}

function formatMinutes(value: number | null) {
  if (value === null) return "—";
  if (value === 0) return "Tidak";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return hours ? `${hours}j ${minutes}m` : `${minutes} menit`;
}

function formatWorkDuration(value: number | null) {
  if (value === null) return "-";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours && minutes) return `${hours} jam ${minutes} menit`;
  if (hours) return `${hours} jam`;
  return `${minutes} menit`;
}

function minutesForPdf(value: number | null) {
  return value === null ? "Belum tercatat" : value ? `${value} menit` : "Tidak";
}

function sortRowsForPdf(rows: AdminReportRow[]) {
  return [...rows].sort((a, b) => {
    let employeeOrder = 0;
    if (a.employeeNumber === null) {
      employeeOrder = b.employeeNumber === null ? 0 : 1;
    } else if (b.employeeNumber === null) {
      employeeOrder = -1;
    } else {
      const aNumber = a.employeeNumber.trim();
      const bNumber = b.employeeNumber.trim();
      const aIsNumeric = /^\d+$/.test(aNumber);
      const bIsNumeric = /^\d+$/.test(bNumber);

      if (aIsNumeric && bIsNumeric) {
        const aNumericValue = BigInt(aNumber);
        const bNumericValue = BigInt(bNumber);
        employeeOrder =
          aNumericValue < bNumericValue
            ? -1
            : aNumericValue > bNumericValue
              ? 1
              : 0;
      } else if (aIsNumeric !== bIsNumeric) {
        employeeOrder = aIsNumeric ? -1 : 1;
      } else {
        employeeOrder = aNumber.localeCompare(bNumber, "id", {
          numeric: true,
        });
      }
    }

    return employeeOrder || a.workDate.localeCompare(b.workDate);
  });
}

function createPdf(
  rows: AdminReportRow[],
  filters: AdminReportFilters,
  selectedUnitName: string,
  units: { id: string; name: string }[]
) {
  const document = new jsPDF({ orientation: "landscape" });
  const summary = new Map<
    string,
    { attendance: number; late: number; early: number }
  >();
  units
    .filter((unit) => !filters.unitId || unit.id === filters.unitId)
    .forEach((unit) => {
      summary.set(unit.name, { attendance: 0, late: 0, early: 0 });
    });

  rows.forEach((row) => {
    const current = summary.get(row.unitName) ?? {
      attendance: 0,
      late: 0,
      early: 0,
    };
    current.attendance += 1;
    if (row.lateMinutes !== null && row.lateMinutes > 0) current.late += 1;
    if (row.earlyLeaveMinutes !== null && row.earlyLeaveMinutes > 0) {
      current.early += 1;
    }
    summary.set(row.unitName, current);
  });

  document.setFontSize(16);
  document.text("Laporan Presensi Karyawan", 14, 16);
  document.setFontSize(10);
  document.text(
    `Periode: ${formatDate(filters.from)} - ${formatDate(filters.to)} | Unit: ${selectedUnitName}`,
    14,
    23
  );
  document.text(
    "Terlambat dihitung setelah jam mulai; pulang cepat dihitung sebelum jam selesai sesuai jadwal karyawan (WIB).",
    14,
    29
  );

  autoTable(document, {
    startY: 35,
    head: [["Unit kerja", "Total catatan", "Terlambat", "Pulang cepat"]],
    body: [...summary.entries()].map(([unit, data]) => [
      unit,
      String(data.attendance),
      String(data.late),
      String(data.early),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [4, 120, 87] },
  });

  const summaryEndY =
    (document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 35;
  const sortedRows = sortRowsForPdf(rows);
  autoTable(document, {
    startY: summaryEndY + 8,
    head: [[
      "Tanggal",
      "No. pegawai",
      "Nama karyawan",
      "Status karyawan",
      "Unit kerja",
      "Grup jadwal",
      "Jadwal",
      "Cek in",
      "Terlambat",
      "Cek out",
      "Pulang cepat",
      "Total jam kerja",
    ]],
    body: sortedRows.map((row) => [
      formatDate(row.workDate),
      row.employeeNumber ?? "-",
      row.employeeName,
      row.employeeStatus === "shift" ? "Shift" : "Harian",
      row.unitName,
      row.groupName,
      `${row.scheduleName} (${row.scheduleStart ?? "--:--"}-${row.scheduleEnd ?? "--:--"})`,
      formatTime(row.checkInAt),
      minutesForPdf(row.lateMinutes),
      formatTime(row.checkOutAt),
      minutesForPdf(row.earlyLeaveMinutes),
      formatWorkDuration(row.totalWorkMinutes),
    ]),
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1.8, overflow: "linebreak" },
    headStyles: { fillColor: [15, 23, 42] },
    didDrawPage: () => {
      document.setFontSize(8);
      document.text(
        `RS Arun Lhokseumawe | Halaman ${document.getNumberOfPages()}`,
        14,
        document.internal.pageSize.height - 7
      );
    },
  });

  const filename = `laporan-presensi-${filters.from}-${filters.to}.pdf`;
  document.save(filename);
}

export function AdminReport({ result }: { result: AdminReportResult }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { rows, filters } = result;

  const summary = new Map<
    string,
    { attendance: number; late: number; early: number }
  >();
  if (result.error === null) {
    result.units
      .filter((unit) => !filters.unitId || unit.id === filters.unitId)
      .forEach((unit) => {
        summary.set(unit.name, { attendance: 0, late: 0, early: 0 });
      });
  }
  rows.forEach((row) => {
    const current = summary.get(row.unitName) ?? {
      attendance: 0,
      late: 0,
      early: 0,
    };
    current.attendance += 1;
    if (row.lateMinutes !== null && row.lateMinutes > 0) current.late += 1;
    if (row.earlyLeaveMinutes !== null && row.earlyLeaveMinutes > 0) {
      current.early += 1;
    }
    summary.set(row.unitName, current);
  });
  const selectedUnitName = filters.unitId
    ? result.units.find((unit) => unit.id === filters.unitId)?.name ??
      "Unit tidak ditemukan"
    : "Semua unit";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form action="/admin/laporan" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="report-from">
              Dari tanggal
            </label>
            <input className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" id="report-from" name="from" required type="date" defaultValue={filters.from} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="report-to">
              Sampai tanggal
            </label>
            <input className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" id="report-to" name="to" required type="date" defaultValue={filters.to} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="report-unit">
              Unit kerja
            </label>
            <select className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" id="report-unit" name="unit" defaultValue={filters.unitId}>
              <option value="">Semua unit kerja</option>
              {result.units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
              Tampilkan
            </button>
            <button
              className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDownloading || result.error !== null || rows.length === 0}
              onClick={() => {
                setIsDownloading(true);
                try {
                  createPdf(rows, filters, selectedUnitName, result.units);
                } finally {
                  setIsDownloading(false);
                }
              }}
              type="button"
            >
              {isDownloading ? "Menyiapkan..." : "Download PDF"}
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          Maksimal rentang 366 hari. Keterlambatan dan pulang cepat dihitung dari jadwal kerja yang dipetakan ke karyawan. Waktu memakai WIB. Laporan merangkum catatan presensi tersimpan; hari tanpa catatan tidak otomatis dihitung sebagai absen karena kalender hari kerja belum diatur.
        </p>
      </section>

      {result.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          {result.error}
        </p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Total catatan presensi</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length}</p>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm text-amber-800">Catatan terlambat</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">
                {rows.filter((row) => (row.lateMinutes ?? 0) > 0).length}
              </p>
            </article>
            <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm text-rose-800">Catatan pulang cepat</p>
              <p className="mt-2 text-3xl font-bold text-rose-900">
                {rows.filter((row) => (row.earlyLeaveMinutes ?? 0) > 0).length}
              </p>
            </article>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">Ringkasan per unit kerja</h2>
            </div>
            {summary.size ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Unit kerja</th>
                      <th className="px-5 py-3">Catatan presensi</th>
                      <th className="px-5 py-3">Terlambat</th>
                      <th className="px-5 py-3">Pulang cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...summary.entries()].map(([unit, value]) => (
                      <tr key={unit}>
                        <td className="px-5 py-3 font-medium text-slate-800">{unit}</td>
                        <td className="px-5 py-3">{value.attendance}</td>
                        <td className="px-5 py-3">{value.late}</td>
                        <td className="px-5 py-3">{value.early}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-5 text-sm text-slate-500">Tidak ada catatan presensi pada rentang tersebut.</p>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">Rincian presensi karyawan</h2>
                  <p className="mt-1 text-sm text-slate-500">{rows.length} catatan</p>
            </div>
            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Karyawan</th>
                      <th className="px-4 py-3">Status karyawan</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Grup jadwal</th>
                      <th className="px-4 py-3">Jadwal</th>
                      <th className="px-4 py-3">Cek in</th>
                      <th className="px-4 py-3">Terlambat</th>
                      <th className="px-4 py-3">Cek out</th>
                      <th className="px-4 py-3">Pulang cepat</th>
                      <th className="px-4 py-3">Total Jam Kerja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td className="whitespace-nowrap px-4 py-3">{formatDate(row.workDate)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{row.employeeName}</p>
                          <p className="text-xs text-slate-500">{row.employeeNumber ?? row.position ?? "—"}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {row.employeeStatus === "shift" ? "Shift" : "Harian"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{row.unitName}</td>
                        <td className="whitespace-nowrap px-4 py-3">{row.groupName}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {row.scheduleName}
                          <span className="block text-xs text-slate-500">
                            {row.scheduleStart ?? "--:--"}–{row.scheduleEnd ?? "--:--"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{formatTime(row.checkInAt)}</td>
                        <td className={`whitespace-nowrap px-4 py-3 ${(row.lateMinutes ?? 0) > 0 ? "font-semibold text-amber-700" : ""}`}>
                          {formatMinutes(row.lateMinutes)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{formatTime(row.checkOutAt)}</td>
                        <td className={`whitespace-nowrap px-4 py-3 ${(row.earlyLeaveMinutes ?? 0) > 0 ? "font-semibold text-rose-700" : ""}`}>
                          {formatMinutes(row.earlyLeaveMinutes)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatWorkDuration(row.totalWorkMinutes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-5 text-sm text-slate-500">Tidak ada catatan presensi pada rentang tanggal yang dipilih.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

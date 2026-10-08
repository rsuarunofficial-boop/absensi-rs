import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DataLoading } from "@/components/data-loading";
import { getEmployeeProfile } from "@/lib/attendance/data";

export default function ProfilPage() {
  return (
    <AppShell activePage="profil">
      <div className="space-y-5">
        <Suspense fallback={<DataLoading />}>
          <ProfileContent />
        </Suspense>
        <section className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-semibold text-slate-900">Akun</h2>
            <p className="mt-1 text-sm text-slate-600">
              Kelola sesi masuk Anda.
            </p>
          </div>
          <SignOutButton />
          <Link
            className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 underline underline-offset-4"
            href="/"
          >
            Kembali ke beranda
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

async function ProfileContent() {
  const profileResult = await getEmployeeProfile();
  const profile = profileResult.data;
  const profileFields = [
    {
      label: "Nomor pegawai",
      value: profile?.employee_number ?? "Belum diisi",
    },
    { label: "Unit kerja", value: profile?.department ?? "Belum diisi" },
    { label: "Jabatan", value: profile?.position ?? "Belum diisi" },
    {
      label: "Status karyawan",
      value:
        profile?.employee_status === "shift"
          ? "Shift"
          : profile?.employee_status === "harian"
            ? "Harian"
            : "Belum diatur",
    },
    { label: "Grup jadwal", value: profile?.shift_name ?? "Belum diatur" },
  ];

  return (
    <>
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Akun
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Profil saya</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Informasi akun karyawan yang terhubung ke aplikasi.
          </p>
        </header>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800"
            >
              K
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                {profile?.full_name ?? "Karyawan"}
              </h2>
              <p className="text-sm text-slate-500">Sesi akun aktif</p>
            </div>
          </div>
          <dl className="divide-y divide-slate-100">
            {profileFields.map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <dt className="text-sm text-slate-500">{field.label}</dt>
                <dd className="text-right text-sm font-medium text-slate-800">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {profileResult.error ? (
          <p
            className="rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-rose-800"
            role="alert"
          >
            {profileResult.error} Pastikan migrasi database sudah dijalankan.
          </p>
        ) : !profile ? (
          <p className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Profil belum dibuat. Administrator perlu menambahkan data profil
            dengan ID pengguna Supabase Anda.
          </p>
        ) : null}

        {profile?.role === "admin" ? (
          <Link
            className="flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/admin"
          >
            Buka dashboard admin
          </Link>
        ) : null}
    </>
  );
}

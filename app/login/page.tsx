import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-slate-50 to-white px-4 py-8">
      <div className="w-full max-w-sm">
        <header className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-700 text-3xl font-bold text-white shadow-lg shadow-emerald-900/20">
            +
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            RS Arun Lhokseumawe
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Masuk ke akun karyawan
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Gunakan email dan password akun yang telah didaftarkan oleh
            administrator.
          </p>
        </header>

        <LoginForm />

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Belum memiliki akun? Hubungi administrator RS Arun.
        </p>
      </div>
    </main>
  );
}

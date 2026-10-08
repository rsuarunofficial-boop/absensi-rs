import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-5 text-slate-800">
      <section className="w-full max-w-sm rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          RS Arun Lhokseumawe
        </p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Anda sedang offline
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Halaman ini hanya memberi informasi saat koneksi terputus. Sambungkan
          kembali internet untuk memuat data aplikasi.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"
          href="/"
        >
          Coba lagi
        </Link>
      </section>
    </main>
  );
}

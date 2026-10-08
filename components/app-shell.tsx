import Link from "next/link";
import type { ReactNode } from "react";

type AppPage = "beranda" | "riwayat" | "profil";

const navigation: {
  href: string;
  label: string;
  page: AppPage;
  icon: ReactNode;
}[] = [
  {
    href: "/",
    label: "Beranda",
    page: "beranda",
    icon: (
      <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" />
    ),
  },
  {
    href: "/riwayat",
    label: "Riwayat",
    page: "riwayat",
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
        <path d="M3 3v5h5m4-1v5l3 2" />
      </>
    ),
  },
  {
    href: "/profil",
    label: "Profil",
    page: "profil",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
  },
];

export function AppShell({
  activePage,
  children,
}: {
  activePage: AppPage;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pb-28 pt-5 sm:px-6">
        {children}
      </div>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 px-3 py-2">
          {navigation.map((item) => {
            const isActive = item.page === activePage;

            return (
              <Link
                key={item.page}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition ${
                  isActive
                    ? "text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
                href={item.href}
              >
                <svg
                  aria-hidden="true"
                  className={`h-5 w-5 ${isActive ? "fill-blue-600 text-blue-600" : "fill-none"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  {item.icon}
                </svg>
                {item.label}
                {isActive && <span className="h-0.5 w-4 rounded-full bg-blue-600" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

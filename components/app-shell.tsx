import Link from "next/link";
import type { ReactNode } from "react";

type AppPage = "beranda" | "riwayat" | "profil";

const navigation: { href: string; label: string; page: AppPage; icon: string }[] =
  [
    { href: "/", label: "Beranda", page: "beranda", icon: "⌂" },
    { href: "/riwayat", label: "Riwayat", page: "riwayat", icon: "◷" },
    { href: "/profil", label: "Profil", page: "profil", icon: "○" },
  ];

export function AppShell({
  activePage,
  children,
}: {
  activePage: AppPage;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-white text-slate-800">
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
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? "text-emerald-800"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
                href={item.href}
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

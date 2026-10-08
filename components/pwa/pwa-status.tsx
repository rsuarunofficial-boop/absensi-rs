"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallState =
  | "available"
  | "installed"
  | "unavailable"
  | "installing";

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineStatus() {
  return navigator.onLine;
}

function getServerOnlineStatus() {
  return true;
}

export function PwaStatus() {
  const [installState, setInstallState] =
    useState<InstallState>("unavailable");
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatus,
    getServerOnlineStatus
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setInstallState("available");
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstallState("installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error: unknown) => {
          if (!isMounted) return;
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Service worker tidak dapat didaftarkan."
          );
        });
    }

    return () => {
      isMounted = false;
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt || installState === "installing") return;

    setInstallState("installing");
    setErrorMessage("");

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      setInstallState(choice.outcome === "accepted" ? "installed" : "unavailable");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Aplikasi tidak dapat dipasang."
      );
      setInstallState("available");
    }
  }

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Aplikasi perangkat</h2>
          <p className="mt-1 text-sm text-slate-600">
            {isOnline
              ? "Koneksi internet tersedia."
              : "Offline. Data presensi belum disimpan di perangkat."}
          </p>
        </div>
        <span
          aria-label={isOnline ? "Online" : "Offline"}
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            isOnline ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
      </div>

      {installState === "available" || installState === "installing" ? (
        <button
          className="mt-4 min-h-11 w-full rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
          disabled={installState === "installing"}
          onClick={installApp}
          type="button"
        >
          {installState === "installing"
            ? "Menyiapkan pemasangan..."
            : "Pasang aplikasi"}
        </button>
      ) : installState === "installed" ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          Aplikasi sudah terpasang di perangkat ini.
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Gunakan menu browser &quot;Tambahkan ke layar utama&quot; untuk memasang
          aplikasi.
        </p>
      )}

      {errorMessage ? (
        <p className="mt-3 break-words text-xs text-rose-700" role="status">
          Tidak dapat menyiapkan PWA: {errorMessage}
        </p>
      ) : null}
    </section>
  );
}

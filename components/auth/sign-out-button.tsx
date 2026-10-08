"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setErrorMessage(`Tidak dapat keluar: ${error.message}`);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? `Tidak dapat keluar: ${error.message}`
          : "Tidak dapat keluar. Silakan coba kembali."
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div>
      <button
        className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        {isSigningOut ? "Keluar..." : "Keluar dari akun"}
      </button>
      {errorMessage ? (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

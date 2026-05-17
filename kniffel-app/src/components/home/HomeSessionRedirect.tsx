"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

export function HomeSessionRedirect() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/session", {
          cache: "no-store"
        });

        if (!active) {
          return;
        }

        if (response.ok) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // Stay on the landing page when the lightweight session check fails.
      }

      if (active) {
        setCheckingSession(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  if (!checkingSession) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-4 pt-4"
      role="status"
    >
      <div className="rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-semibold text-emerald-50/75 shadow-[0_14px_44px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        Session wird geprueft...
      </div>
    </div>
  );
}

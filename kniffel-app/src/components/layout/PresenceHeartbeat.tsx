"use client";

import { useEffect } from "react";

const PRESENCE_INTERVAL_MS = 15_000;

export function PresenceHeartbeat() {
  useEffect(() => {
    let active = true;

    async function pingPresence() {
      if (!active || document.visibilityState !== "visible") {
        return;
      }

      try {
        await fetch("/api/presence", {
          cache: "no-store",
          method: "POST"
        });
      } catch {
        // Presence is best-effort; auth and gameplay must not depend on it.
      }
    }

    function handleVisibilityChange() {
      void pingPresence();
    }

    void pingPresence();

    const intervalId = window.setInterval(() => {
      void pingPresence();
    }, PRESENCE_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

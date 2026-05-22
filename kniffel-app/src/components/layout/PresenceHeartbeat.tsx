"use client";

import { useCallback } from "react";

import { useVisiblePolling } from "@/components/hooks/useVisiblePolling";

const PRESENCE_INTERVAL_MS = 20_000;

export function PresenceHeartbeat() {
  const pingPresence = useCallback(async () => {
    try {
      await fetch("/api/presence", {
        cache: "no-store",
        method: "POST"
      });
    } catch {
      // Presence is best-effort; auth and gameplay must not depend on it.
    }
  }, []);

  useVisiblePolling(pingPresence, {
    intervalMs: PRESENCE_INTERVAL_MS,
    refreshOnFocus: false
  });

  return null;
}

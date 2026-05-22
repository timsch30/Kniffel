"use client";

import { useEffect, useRef } from "react";

type UseVisiblePollingOptions = {
  enabled?: boolean;
  intervalMs: number;
  refreshOnFocus?: boolean;
  refreshOnVisible?: boolean;
  runImmediately?: boolean;
};

export function useVisiblePolling(
  callback: () => void | Promise<void>,
  {
    enabled = true,
    intervalMs,
    refreshOnFocus = true,
    refreshOnVisible = true,
    runImmediately = true
  }: UseVisiblePollingOptions
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      return;
    }

    let active = true;
    let running = false;
    let timeoutId: number | null = null;

    function clearScheduledPoll() {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function schedulePoll(delayMs: number) {
      clearScheduledPoll();

      if (!active || document.visibilityState !== "visible") {
        return;
      }

      timeoutId = window.setTimeout(() => {
        void poll();
      }, delayMs);
    }

    async function poll() {
      timeoutId = null;

      if (!active || document.visibilityState !== "visible") {
        return;
      }

      if (running) {
        schedulePoll(intervalMs);
        return;
      }

      running = true;

      try {
        await callbackRef.current();
      } catch {
        // Poll callbacks are best-effort; keep future polls alive after a transient failure.
      } finally {
        running = false;
      }

      schedulePoll(intervalMs);
    }

    function triggerPoll() {
      if (!active || document.visibilityState !== "visible") {
        return;
      }

      clearScheduledPoll();
      void poll();
    }

    if (runImmediately) {
      triggerPoll();
    } else {
      schedulePoll(intervalMs);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        if (refreshOnVisible) {
          triggerPoll();
        } else {
          schedulePoll(intervalMs);
        }
      } else {
        clearScheduledPoll();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (refreshOnFocus) {
      window.addEventListener("focus", triggerPoll);
    }

    return () => {
      active = false;
      clearScheduledPoll();
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (refreshOnFocus) {
        window.removeEventListener("focus", triggerPoll);
      }
    };
  }, [enabled, intervalMs, refreshOnFocus, refreshOnVisible, runImmediately]);
}

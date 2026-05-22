"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award, BellRing, Gamepad2, UserPlus, Wifi, X } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type NotificationKind = "achievement" | "friend_request" | "game_invite" | "presence";

export type AppNotification = {
  actions?: ReactNode;
  durationMs?: number;
  id: string;
  kind: NotificationKind;
  message?: string;
  meta?: string[];
  title: string;
};

type NotificationContextValue = {
  dismissNotification: (id?: string) => void;
  notify: (notification: AppNotification) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const iconByKind = {
  achievement: Award,
  friend_request: UserPlus,
  game_invite: Gamepad2,
  presence: Wifi
} satisfies Record<NotificationKind, typeof BellRing>;

const accentByKind: Record<NotificationKind, string> = {
  achievement: "border-brass/35 bg-brass/15 text-brass",
  friend_request: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  game_invite: "border-brass/35 bg-brass/15 text-brass",
  presence: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
};

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider.");
  }

  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const currentNotification = notifications[0] ?? null;

  const dismissNotification = useCallback((id?: string) => {
    setNotifications((current) => {
      if (!id) {
        return current.slice(1);
      }

      return current.filter((notification) => notification.id !== id);
    });
  }, []);

  const notify = useCallback((notification: AppNotification) => {
    setNotifications((current) => {
      if (current.some((entry) => entry.id === notification.id)) {
        return current;
      }

      return [...current, notification];
    });
  }, []);

  const value = useMemo(
    () => ({
      dismissNotification,
      notify
    }),
    [dismissNotification, notify]
  );

  useEffect(() => {
    if (!currentNotification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dismissNotification(currentNotification.id);
    }, currentNotification.durationMs ?? 5600);

    return () => window.clearTimeout(timeoutId);
  }, [currentNotification, dismissNotification]);

  const Icon = currentNotification ? iconByKind[currentNotification.kind] : BellRing;
  const durationMs = currentNotification?.durationMs ?? 5600;

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[110] flex justify-center px-3 sm:top-5"
      >
        <AnimatePresence mode="wait">
          {currentNotification ? (
            <motion.div
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              className="pointer-events-auto relative w-full max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-white/10 bg-emerald-950/92 p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:max-w-md sm:p-4 sm:backdrop-blur-xl"
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.98, y: -10 }
              }
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.98, y: -12 }
              }
              key={currentNotification.id}
              role="status"
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: "easeOut" }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent"
              />
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-lg border shadow-sm",
                    accentByKind[currentNotification.kind]
                  )}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-white sm:text-base">
                    {currentNotification.title}
                  </h2>
                  {currentNotification.message ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-50/75 sm:text-sm">
                      {currentNotification.message}
                    </p>
                  ) : null}
                  {currentNotification.meta?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {currentNotification.meta.map((item) => (
                        <Badge className="px-2" key={item} variant="neutral">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {currentNotification.actions ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentNotification.actions}
                    </div>
                  ) : null}
                </div>
                <button
                  aria-label="Benachrichtigung schliessen"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.08] text-emerald-50/70 transition-colors hover:bg-white/[0.13] hover:text-white"
                  onClick={() => dismissNotification(currentNotification.id)}
                  type="button"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <motion.span
                aria-hidden="true"
                animate={shouldReduceMotion ? { width: "100%" } : { width: "0%" }}
                className="absolute bottom-0 left-0 h-0.5 bg-brass"
                initial={{ width: "100%" }}
                transition={{ duration: shouldReduceMotion ? 0.01 : durationMs / 1000, ease: "linear" }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

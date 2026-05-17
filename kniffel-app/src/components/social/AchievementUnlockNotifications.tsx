"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { achievementCategoryLabels } from "@/social/achievements";
import type { Achievement } from "@/social/types";

type AchievementUnlockNotificationsProps = {
  achievements: Achievement[];
  userId: string;
};

const STORAGE_VERSION = "v1";

function getStorageKey(userId: string) {
  return `kniffel:earned-achievements:${STORAGE_VERSION}:${userId}`;
}

function parseStoredIds(value: string | null): string[] | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.flatMap((entry) => {
      if (typeof entry === "string") {
        return [entry];
      }

      if (
        entry &&
        typeof entry === "object" &&
        "id" in entry &&
        typeof entry.id === "string"
      ) {
        return [entry.id];
      }

      return [];
    });
  } catch {
    return null;
  }
}

export function AchievementUnlockNotifications({
  achievements,
  userId
}: AchievementUnlockNotificationsProps) {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const currentAchievement = queue[0];
  const earnedAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.earned),
    [achievements]
  );

  useEffect(() => {
    const storageKey = getStorageKey(userId);
    const storedIds = parseStoredIds(window.localStorage.getItem(storageKey));
    const earnedIds = earnedAchievements.map((achievement) => achievement.id);

    if (!storedIds) {
      window.localStorage.setItem(storageKey, JSON.stringify(earnedIds));
      return;
    }

    const knownIds = new Set(storedIds);
    const newUnlocks = earnedAchievements.filter((achievement) => !knownIds.has(achievement.id));

    if (newUnlocks.length === 0) {
      return;
    }

    setQueue((current) => [...current, ...newUnlocks]);
    window.localStorage.setItem(
      storageKey,
      JSON.stringify([...new Set([...storedIds, ...earnedIds])])
    );
  }, [earnedAchievements, userId]);

  useEffect(() => {
    if (!currentAchievement) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setQueue((current) => current.slice(1));
    }, 4600);

    return () => window.clearTimeout(timeout);
  }, [currentAchievement]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex justify-center px-3 sm:top-20 sm:px-4"
    >
      <AnimatePresence mode="wait">
        {currentAchievement ? (
          <motion.div
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            className="relative w-full max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-brass/35 bg-emerald-950/90 p-3 text-white shadow-[0_22px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:max-w-sm sm:p-4"
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
            key={currentAchievement.id}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: "easeOut" }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent"
            />
            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-brass/30 bg-brass/15 text-brass shadow-sm sm:h-11 sm:w-11">
                <Award aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase text-brass sm:text-xs">
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                  Achievement freigeschaltet
                </p>
                <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white sm:text-base">
                  {currentAchievement.label}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-50/75 sm:text-sm">
                  {currentAchievement.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                  <Badge variant="neutral" className="px-2">
                    {achievementCategoryLabels[currentAchievement.category]}
                  </Badge>
                  <Badge
                    variant={currentAchievement.rarity === "epic" ? "warning" : "neutral"}
                    className="px-2"
                  >
                    {currentAchievement.rarity}
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

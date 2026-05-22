"use client";

import { useCallback, useEffect, useMemo } from "react";

import { useVisiblePolling } from "@/components/hooks/useVisiblePolling";
import { useNotifications } from "@/components/notifications/NotificationProvider";

const ACHIEVEMENT_POLL_INTERVAL_MS = 60_000;
const ACHIEVEMENT_TOAST_DURATION_MS = 4_600;
const STORAGE_VERSION = "v1";

type EarnedAchievement = {
  categoryLabel: string;
  description: string;
  id: string;
  label: string;
  rarity: string;
};

type AchievementsResponse = {
  achievements: EarnedAchievement[];
};

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

export function AchievementNotifications({ userId }: { userId: string }) {
  const { notify } = useNotifications();
  const storageKey = useMemo(() => getStorageKey(userId), [userId]);

  const refreshAchievements = useCallback(async () => {
    try {
      const response = await fetch("/api/social/achievements", {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as AchievementsResponse;
      const earnedIds = data.achievements.map((achievement) => achievement.id);
      const storedIds = parseStoredIds(window.localStorage.getItem(storageKey));

      if (!storedIds) {
        window.localStorage.setItem(storageKey, JSON.stringify(earnedIds));
        return;
      }

      const knownIds = new Set(storedIds);
      const newUnlocks = data.achievements.filter((achievement) => !knownIds.has(achievement.id));

      if (newUnlocks.length === 0) {
        return;
      }

      newUnlocks.forEach((achievement) => {
        notify({
          durationMs: ACHIEVEMENT_TOAST_DURATION_MS,
          id: `achievement:${userId}:${achievement.id}`,
          kind: "achievement",
          message: achievement.description,
          meta: [achievement.categoryLabel, achievement.rarity],
          title: `Achievement freigeschaltet: ${achievement.label}`
        });
      });

      window.localStorage.setItem(
        storageKey,
        JSON.stringify([...new Set([...storedIds, ...earnedIds])])
      );
    } catch {
      // Achievement notifications are best-effort.
    }
  }, [notify, storageKey, userId]);

  useVisiblePolling(refreshAchievements, {
    intervalMs: ACHIEVEMENT_POLL_INTERVAL_MS
  });

  useEffect(() => {
    window.addEventListener("kniffel:score-saved", refreshAchievements);

    return () => {
      window.removeEventListener("kniffel:score-saved", refreshAchievements);
    };
  }, [refreshAchievements]);

  return null;
}

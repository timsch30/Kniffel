"use client";

import { useEffect, useMemo, useState } from "react";

import { useNotifications } from "@/components/notifications/NotificationProvider";
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
  const { notify } = useNotifications();
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

    notify({
      durationMs: 4600,
      id: `achievement:${userId}:${currentAchievement.id}`,
      kind: "achievement",
      message: currentAchievement.description,
      meta: [
        achievementCategoryLabels[currentAchievement.category],
        currentAchievement.rarity
      ],
      title: `Achievement freigeschaltet: ${currentAchievement.label}`
    });

    setQueue((current) => current.slice(1));
  }, [currentAchievement, notify, userId]);

  return null;
}

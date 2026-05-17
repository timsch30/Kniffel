"use client";

import { useMemo, useState } from "react";

import { Award, Lock, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  achievementCategories,
  achievementCategoryLabels
} from "@/social/achievements";
import type { Achievement, AchievementCategory } from "@/social/types";

type AchievementsPanelProps = {
  achievements: Achievement[];
};

type AchievementFilter = "all" | AchievementCategory;

function rarityClass(rarity: Achievement["rarity"], earned: boolean): string {
  if (!earned) {
    return "border-white/10 bg-black/15";
  }

  if (rarity === "epic") {
    return "border-amber-300/35 bg-amber-300/10";
  }

  if (rarity === "rare") {
    return "border-sky-300/25 bg-sky-300/10";
  }

  return "border-emerald-300/25 bg-emerald-300/10";
}

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<AchievementFilter>("all");
  const earnedCount = achievements.filter((achievement) => achievement.earned).length;
  const filteredAchievements = useMemo(
    () =>
      activeFilter === "all"
        ? achievements
        : achievements.filter((achievement) => achievement.category === activeFilter),
    [achievements, activeFilter]
  );
  const filterOptions = [
    { id: "all" as const, label: "Alle", total: achievements.length },
    ...achievementCategories.map((category) => ({
      id: category.id,
      label: category.label,
      total: achievements.filter((achievement) => achievement.category === category.id).length
    }))
  ];

  return (
    <Card className="min-w-0 overflow-hidden !border-white/10 !bg-white/[0.09] p-3 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
            Achievements
          </h2>
          <p className="text-xs text-emerald-50/70 sm:text-sm">
            {earnedCount} von {achievements.length} freigeschaltet
          </p>
        </div>
        <Award aria-hidden="true" className="h-5 w-5 shrink-0 text-brass" />
      </div>

      <div className="-mx-3 mb-3 flex max-w-[calc(100%+1.5rem)] snap-x gap-2 overflow-x-auto px-3 pb-1 sm:-mx-1 sm:mb-4 sm:max-w-[calc(100%+0.5rem)] sm:px-1">
        {filterOptions.map((option) => {
          const active = activeFilter === option.id;
          const categoryEarnedCount =
            option.id === "all"
              ? earnedCount
              : achievements.filter(
                  (achievement) => achievement.category === option.id && achievement.earned
                ).length;

          return (
            <button
              aria-pressed={active}
              className={cn(
                "min-h-9 shrink-0 snap-start rounded-full border px-3 text-xs font-semibold transition-colors",
                active
                  ? "border-brass/45 bg-brass/20 text-amber-50"
                  : "border-white/10 bg-black/15 text-emerald-50/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              )}
              key={option.id}
              onClick={() => setActiveFilter(option.id)}
              type="button"
            >
              {option.label}{" "}
              <span className="text-emerald-50/55">
                {categoryEarnedCount}/{option.total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {filteredAchievements.map((achievement) => {
          const concealed = achievement.hidden && !achievement.earned;
          const progress =
            achievement.target > 0 ? (achievement.progress / achievement.target) * 100 : 0;

          return (
            <div
              className={cn(
                "min-w-0 rounded-lg border p-3 transition-transform duration-200 hover:-translate-y-0.5",
                rarityClass(achievement.rarity, achievement.earned)
              )}
              key={achievement.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                    {concealed ? "Geheimes Achievement" : achievement.label}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-50/70">
                    {concealed
                      ? "Bleibt verborgen, bis du es freischaltest."
                      : achievement.description}
                  </p>
                </div>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white shadow-sm sm:h-9 sm:w-9">
                  {achievement.earned ? (
                    <Sparkles aria-hidden="true" className="h-4 w-4 text-brass" />
                  ) : (
                    <Lock aria-hidden="true" className="h-4 w-4 text-emerald-50/45" />
                  )}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/25">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    achievement.earned ? "bg-brass" : "bg-emerald-50/25"
                  )}
                  style={{ width: `${concealed ? 0 : progress}%` }}
                />
              </div>
              <div className="mt-2 grid gap-2 min-[390px]:flex min-[390px]:items-center min-[390px]:justify-between">
                <p className="text-xs font-medium text-emerald-50/70">
                  {concealed ? "???" : `${achievement.progress}/${achievement.target}`}
                </p>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <Badge variant="neutral" className="max-w-full truncate px-2">
                    {achievementCategoryLabels[achievement.category]}
                  </Badge>
                  <Badge
                    variant={achievement.rarity === "epic" ? "warning" : "neutral"}
                    className="px-2"
                  >
                    {concealed ? "geheim" : achievement.rarity}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
        {filteredAchievements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/15 p-4 text-sm text-emerald-50/65 sm:col-span-2">
            Keine Achievements in dieser Kategorie.
          </div>
        ) : null}
      </div>
    </Card>
  );
}

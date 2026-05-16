import { Award, Lock, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { Achievement } from "@/social/types";

type AchievementsPanelProps = {
  achievements: Achievement[];
};

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
  const earnedCount = achievements.filter((achievement) => achievement.earned).length;

  return (
    <Card className="!border-white/10 !bg-white/[0.09] p-4 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Achievements</h2>
          <p className="text-sm text-emerald-50/70">
            {earnedCount} von {achievements.length} freigeschaltet
          </p>
        </div>
        <Award aria-hidden="true" className="h-5 w-5 text-brass" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {achievements.map((achievement) => (
          <div
            className={cn("rounded-lg border p-3 transition-transform duration-200 hover:-translate-y-0.5", rarityClass(achievement.rarity, achievement.earned))}
            key={achievement.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">
                  {achievement.label}
                </h3>
                <p className="mt-1 text-xs leading-5 text-emerald-50/70">
                  {achievement.description}
                </p>
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white shadow-sm">
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
                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-emerald-50/70">
                {achievement.progress}/{achievement.target}
              </p>
              <Badge variant={achievement.rarity === "epic" ? "warning" : "neutral"}>
                {achievement.rarity}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

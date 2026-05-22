import { Crown, Gauge, Medal, Trophy } from "lucide-react";

import { PlayerAvatar } from "@/components/social/PlayerAvatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { LeaderboardEntry, LeaderboardSortMode } from "@/social/types";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  onSortModeChange: (sortMode: LeaderboardSortMode) => void;
  sortMode: LeaderboardSortMode;
};

const rankingTabs: { icon: typeof Trophy; id: LeaderboardSortMode; label: string }[] = [
  { icon: Trophy, id: "wins", label: "Meiste Siege" },
  { icon: Gauge, id: "average", label: "Hoechster Average" },
  { icon: Medal, id: "highscore", label: "Hoechster Highscore" }
];

function podiumStyle(rank: number): string {
  if (rank === 1) {
    return "border-brass/45 bg-brass/15";
  }

  if (rank === 2) {
    return "border-white/15 bg-white/10";
  }

  if (rank === 3) {
    return "border-amber-200/25 bg-amber-200/10";
  }

  return "border-white/10 bg-black/15";
}

export function Leaderboard({ entries, onSortModeChange, sortMode }: LeaderboardProps) {
  return (
    <Card className="!border-white/10 !bg-white/[0.09] p-4 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Ranking</h2>
          <p className="text-sm text-emerald-50/70">Siege, Schnitt und Highscore</p>
        </div>
        <Trophy aria-hidden="true" className="h-5 w-5 text-brass" />
      </div>

      <div
        aria-label="Ranking filtern"
        className="my-4 grid grid-cols-1 gap-1 rounded-lg border border-white/10 bg-black/15 p-1 sm:grid-cols-3"
        role="tablist"
      >
        {rankingTabs.map(({ icon: Icon, id, label }) => {
          const active = sortMode === id;

          return (
            <button
              aria-selected={active}
              className={cn(
                "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-brass text-ink shadow-sm"
                  : "text-emerald-50/65 hover:bg-white/10 hover:text-white"
              )}
              key={id}
              onClick={() => onSortModeChange(id)}
              role="tab"
              type="button"
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-2">
        {entries.map((entry) => (
          <div
            className={cn(
              "grid grid-cols-[auto_1fr] gap-3 rounded-lg border px-3 py-3 transition-transform duration-200 hover:-translate-y-0.5 sm:grid-cols-[auto_1fr_auto]",
              podiumStyle(entry.rank)
            )}
            key={entry.player.id}
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/12 text-sm font-bold text-white shadow-sm ring-1 ring-white/10">
                {entry.rank === 1 ? <Crown aria-hidden="true" className="h-4 w-4 text-brass" /> : entry.rank}
              </span>
              <PlayerAvatar className="h-10 w-10 rounded-2xl text-xs" player={entry.player} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-white">
                  {entry.player.name}
                </p>
                {entry.rank <= 3 ? <Badge variant="warning">Top {entry.rank}</Badge> : null}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <span className="rounded-md bg-white/10 px-2 py-1 text-emerald-50/70">
                  Siege <strong className="text-white">{entry.wins}</strong>
                </span>
                <span className="rounded-md bg-white/10 px-2 py-1 text-emerald-50/70">
                  Schnitt <strong className="text-white">{entry.averagePoints}</strong>
                </span>
                <span className="rounded-md bg-white/10 px-2 py-1 text-emerald-50/70">
                  Highscore <strong className="text-white">{entry.highestScore}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

import { Crown, Sparkles, Trophy } from "lucide-react";

import { PlayerAvatar } from "@/components/social/PlayerAvatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { LeaderboardEntry } from "@/social/types";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
};

function podiumStyle(rank: number): string {
  if (rank === 1) {
    return "border-brass/40 bg-amber-50/85 dark:border-amber-300/25 dark:bg-amber-300/10";
  }

  if (rank === 2) {
    return "border-slate-300 bg-slate-50/90 dark:border-zinc-500/30 dark:bg-white/[0.06]";
  }

  if (rank === 3) {
    return "border-orange-300/60 bg-orange-50/80 dark:border-orange-300/25 dark:bg-orange-300/10";
  }

  return "border-slate-200/80 bg-white/75 dark:border-white/10 dark:bg-white/[0.03]";
}

export function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">Ranking</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Siege, Schnitt und Kniffel</p>
        </div>
        <Trophy aria-hidden="true" className="h-5 w-5 text-brass" />
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
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-bold text-ink shadow-sm ring-1 ring-slate-200 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-white/10">
                {entry.rank === 1 ? <Crown aria-hidden="true" className="h-4 w-4 text-brass" /> : entry.rank}
              </span>
              <PlayerAvatar className="h-10 w-10 rounded-2xl text-xs" player={entry.player} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-ink dark:text-zinc-50">
                  {entry.player.name}
                </p>
                {entry.rank <= 3 ? <Badge variant="warning">Top {entry.rank}</Badge> : null}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <span className="rounded-md bg-white/70 px-2 py-1 text-slate-600 dark:bg-white/[0.05] dark:text-zinc-400">
                  Siege <strong className="text-ink dark:text-zinc-100">{entry.wins}</strong>
                </span>
                <span className="rounded-md bg-white/70 px-2 py-1 text-slate-600 dark:bg-white/[0.05] dark:text-zinc-400">
                  Schnitt <strong className="text-ink dark:text-zinc-100">{entry.averagePoints}</strong>
                </span>
                <span className="rounded-md bg-white/70 px-2 py-1 text-slate-600 dark:bg-white/[0.05] dark:text-zinc-400">
                  <Sparkles aria-hidden="true" className="mr-1 inline h-3 w-3" />
                  <strong className="text-ink dark:text-zinc-100">{entry.totalKniffel}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

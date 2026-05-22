import { Gauge, Medal, Sparkles, Swords, Trophy } from "lucide-react";

import { MetricTile } from "@/components/social/MetricTile";
import { PlayerAvatar } from "@/components/social/PlayerAvatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { HeadToHeadStats, Player } from "@/social/types";

type HeadToHeadCardProps = {
  friend: Player;
  stats: HeadToHeadStats;
  user: Player;
};

export function HeadToHeadCard({ friend, stats, user }: HeadToHeadCardProps) {
  return (
    <Card className="overflow-hidden !border-white/10 !bg-white/[0.09] p-0 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="border-b border-white/10 bg-black/20 px-5 py-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-100">
              Direktvergleich
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              Du vs {friend.name}
            </h2>
          </div>
          <div className="flex items-center -space-x-2">
            <PlayerAvatar className="h-11 w-11 rounded-2xl ring-2 ring-emerald-950" player={user} />
            <PlayerAvatar className="h-11 w-11 rounded-2xl ring-2 ring-emerald-950" player={friend} />
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-white/10 px-3 py-3 text-sm font-semibold text-white backdrop-blur">
          {stats.insight}
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-white/10 bg-black/15 p-3">
            <p className="text-xs text-emerald-50/70">Du</p>
            <p className="text-2xl font-semibold text-white">{stats.wins.user}</p>
          </div>
          <div className="grid place-items-center">
            <Swords aria-hidden="true" className="h-5 w-5 text-emerald-50/55" />
            <p className="mt-1 text-xs text-emerald-50/70">{stats.directMatches} Spiele</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/15 p-3">
            <p className="text-xs text-emerald-50/70">{friend.name}</p>
            <p className="text-2xl font-semibold text-white">{stats.wins.friend}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            icon={Gauge}
            label="Schnitt"
            value={`${stats.averagePoints.user} / ${stats.averagePoints.friend}`}
          />
          <MetricTile
            icon={Medal}
            label="Highscore"
            value={`${stats.highestScore.user} / ${stats.highestScore.friend}`}
          />
          <MetricTile icon={Sparkles} label="Kniffel" value={`${stats.kniffel.user} / ${stats.kniffel.friend}`} />
          <MetricTile
            icon={Trophy}
            label="Letzter Gewinner"
            value={stats.lastWinner?.name ?? "Offen"}
          />
        </div>

        <Badge className="w-fit" variant="accent">
          Werte: Du / {friend.name}
        </Badge>
      </div>
    </Card>
  );
}

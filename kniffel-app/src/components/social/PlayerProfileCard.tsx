import { Flame, Medal, Percent, Sigma, Sparkles, Trophy } from "lucide-react";

import { PlayerAvatar } from "@/components/social/PlayerAvatar";
import { MetricTile } from "@/components/social/MetricTile";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Player, PlayerStats } from "@/social/types";

type PlayerProfileCardProps = {
  label?: string;
  player: Player;
  stats: PlayerStats;
};

export function PlayerProfileCard({ label = "Spielerprofil", player, stats }: PlayerProfileCardProps) {
  return (
    <Card className="overflow-hidden !border-white/10 !bg-white/[0.09] p-0 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="border-b border-white/10 bg-black/15 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar className="h-14 w-14 rounded-3xl text-base" player={player} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-100">
                {label}
              </p>
              <h2 className="truncate text-2xl font-semibold tracking-tight text-white">
                {player.name}
              </h2>
            </div>
          </div>
          <Badge variant={stats.currentWinStreak > 0 ? "success" : "neutral"}>
            Serie {stats.currentWinStreak}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <MetricTile icon={Trophy} label="Siege" value={stats.gamesWon} />
        <MetricTile icon={Percent} label="Winrate" value={`${stats.winRate}%`} />
        <MetricTile icon={Sigma} label="Schnitt" value={stats.averagePoints} />
        <MetricTile icon={Medal} label="Highscore" value={stats.highestScore} />
        <MetricTile icon={Sparkles} label="Kniffel" value={stats.totalKniffel} />
        <MetricTile label="Spiele" value={stats.gamesPlayed} />
        <MetricTile icon={Flame} label="Laengste Serie" value={stats.longestWinStreak} />
        <MetricTile label="Gesamtpunkte" value={stats.totalPoints} />
      </div>
    </Card>
  );
}

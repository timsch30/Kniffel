import { CalendarDays, Sparkles, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getHighlightLabel } from "@/social/stats";
import type { Game, Player } from "@/social/types";

type RecentGamesProps = {
  games: Game[];
  players: Player[];
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function getPlayerName(players: Player[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? "Unbekannt";
}

export function RecentGames({ games, players }: RecentGamesProps) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">Letzte Spiele</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Kompakte Historie</p>
        </div>
        <CalendarDays aria-hidden="true" className="h-5 w-5 text-felt dark:text-emerald-300" />
      </div>

      <div className="grid gap-3">
        {games.map((game) => (
          <article
            className="rounded-lg border border-slate-200/75 bg-slate-50/75 p-3 dark:border-white/10 dark:bg-white/[0.04]"
            key={game.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
                  <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                  {formatDate(game.date)}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-ink dark:text-zinc-50">
                  {game.results.map((result) => getPlayerName(players, result.playerId)).join(" vs ")}
                </h3>
              </div>
              <Badge variant="success">
                <Trophy aria-hidden="true" className="mr-1 h-3 w-3" />
                {getPlayerName(players, game.winnerId)}
              </Badge>
            </div>

            <div className="mt-3 grid gap-1.5">
              {[...game.results]
                .sort((a, b) => b.score - a.score)
                .map((result) => (
                  <div className="flex items-center justify-between gap-3 text-sm" key={result.playerId}>
                    <span className="truncate text-slate-600 dark:text-zinc-400">
                      {getPlayerName(players, result.playerId)}
                    </span>
                    <span className="font-semibold text-ink dark:text-zinc-100">{result.score}</span>
                  </div>
                ))}
            </div>

            {game.highlights.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {game.highlights.map((highlight) => (
                  <Badge key={highlight} variant={highlight === "NEW_RECORD" ? "warning" : "neutral"}>
                    <Sparkles aria-hidden="true" className="mr-1 h-3 w-3" />
                    {getHighlightLabel(highlight)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </Card>
  );
}

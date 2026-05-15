import { cn } from "@/lib/cn";

type Player = {
  id: string;
  name: string;
  score?: number;
};

type PlayerListProps = {
  players?: Player[];
  currentPlayerId?: string;
};

const placeholderPlayers: Player[] = [
  { id: "1", name: "Anna", score: 42 },
  { id: "2", name: "Ben", score: 36 },
  { id: "3", name: "Clara", score: 28 }
];

export function PlayerList({ currentPlayerId = "1", players = placeholderPlayers }: PlayerListProps) {
  return (
    <div className="grid gap-3">
      {players.map((player) => {
        const isCurrent = player.id === currentPlayerId;

        return (
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors",
              isCurrent
                ? "border-felt/30 bg-felt/10 dark:border-emerald-300/30 dark:bg-emerald-300/10"
                : "border-slate-200 bg-white/75 dark:border-white/10 dark:bg-white/5"
            )}
            key={player.id}
          >
            <span className="font-semibold text-ink dark:text-zinc-50">{player.name}</span>
            <span className="text-slate-600 dark:text-zinc-400">{player.score ?? 0} Punkte</span>
          </div>
        );
      })}
    </div>
  );
}

import { cn } from "@/lib/cn";
import type { Player } from "@/social/types";

type PlayerAvatarProps = {
  className?: string;
  player: Player;
};

export function PlayerAvatar({ className, player }: PlayerAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-bold shadow-sm ring-1 ring-white/50 dark:ring-white/10",
        player.color,
        className
      )}
    >
      {player.initials}
    </span>
  );
}

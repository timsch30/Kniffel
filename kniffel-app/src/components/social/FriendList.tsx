"use client";

import { Clock, UserPlus } from "lucide-react";

import { PlayerAvatar } from "@/components/social/PlayerAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { Friend, PlayerId } from "@/social/types";

type FriendListProps = {
  friends: Friend[];
  onSelect: (friendId: PlayerId) => void;
  pendingCount: number;
  selectedFriendId: PlayerId;
};

function formatLastActive(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

export function FriendList({ friends, onSelect, pendingCount, selectedFriendId }: FriendListProps) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">Freunde</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">{friends.length} aktiv</p>
        </div>
        <Badge variant={pendingCount > 0 ? "warning" : "neutral"}>
          <UserPlus aria-hidden="true" className="mr-1 h-3 w-3" />
          {pendingCount} offen
        </Badge>
      </div>

      <div className="grid gap-2">
        {friends.map((friend) => {
          const selected = friend.id === selectedFriendId;

          return (
            <button
              aria-pressed={selected}
              className={cn(
                "group flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-all duration-200",
                selected
                  ? "border-felt/30 bg-felt/10 shadow-sm dark:border-emerald-300/25 dark:bg-emerald-300/10"
                  : "border-slate-200/80 bg-white/70 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
              )}
              key={friend.id}
              onClick={() => onSelect(friend.id)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                <PlayerAvatar player={friend} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink dark:text-zinc-50">
                    {friend.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                    <Clock aria-hidden="true" className="h-3 w-3" />
                    {formatLastActive(friend.lastActiveAt)}
                  </span>
                </span>
              </span>
              <span className="text-xs font-semibold text-slate-500 transition-colors group-hover:text-ink dark:text-zinc-500 dark:group-hover:text-zinc-200">
                Profil
              </span>
            </button>
          );
        })}
      </div>

      <Button className="mt-4 w-full" type="button" variant="secondary">
        <UserPlus aria-hidden="true" className="h-4 w-4" />
        Anfrage vorbereiten
      </Button>
    </Card>
  );
}

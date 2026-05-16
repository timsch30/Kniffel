"use client";

import { Check, Clock, Trash2, UserPlus, X } from "lucide-react";

import { PlayerAvatar } from "@/components/social/PlayerAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import type { SocialFriendRequest } from "@/server/social/state";
import type { Friend, PlayerId } from "@/social/types";

type FriendListProps = {
  acceptFriendRequestAction: (requestId: string) => void | Promise<void>;
  declineFriendRequestAction: (requestId: string) => void | Promise<void>;
  friends: Friend[];
  incomingRequests: SocialFriendRequest[];
  onSelect: (friendId: PlayerId) => void;
  outgoingRequests: SocialFriendRequest[];
  removeFriendAction: (friendId: string) => void | Promise<void>;
  sendFriendRequestAction: (formData: FormData) => void | Promise<void>;
  selectedFriendId: PlayerId;
};

function formatLastActive(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMs < 60_000) {
    return "gerade eben";
  }

  if (diffMinutes < 60) {
    return `vor ${diffMinutes} Min.`;
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(date);
}

export function FriendList({
  acceptFriendRequestAction,
  declineFriendRequestAction,
  friends,
  incomingRequests,
  onSelect,
  outgoingRequests,
  removeFriendAction,
  sendFriendRequestAction,
  selectedFriendId
}: FriendListProps) {
  const pendingCount = incomingRequests.length + outgoingRequests.length;

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
        {friends.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            Noch keine Freunde.
          </div>
        ) : null}

        {friends.map((friend) => {
          const selected = friend.id === selectedFriendId;

          return (
            <div
              className={cn(
                "group flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-all duration-200",
                selected
                  ? "border-felt/30 bg-felt/10 shadow-sm dark:border-emerald-300/25 dark:bg-emerald-300/10"
                  : "border-slate-200/80 bg-white/70 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
              )}
              key={friend.id}
            >
              <button
                aria-pressed={selected}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => onSelect(friend.id)}
                type="button"
              >
                <PlayerAvatar player={friend} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="block truncate text-sm font-semibold text-ink dark:text-zinc-50">
                      {friend.name}
                    </span>
                    <span
                      aria-label={friend.isOnline ? "Online" : "Offline"}
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        friend.isOnline
                          ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
                          : "bg-slate-300 dark:bg-zinc-600"
                      )}
                    />
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                    <Clock aria-hidden="true" className="h-3 w-3" />
                    {friend.isOnline ? "Online" : `Zuletzt ${formatLastActive(friend.lastActiveAt)}`}
                  </span>
                </span>
              </button>
              <form action={removeFriendAction.bind(null, friend.id)}>
                <Button
                  aria-label={`${friend.name} entfernen`}
                  size="sm"
                  type="submit"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </Button>
              </form>
            </div>
          );
        })}
      </div>

      {incomingRequests.length > 0 ? (
        <div className="mt-4 grid gap-2">
          <p className="text-sm font-semibold text-ink dark:text-zinc-50">Eingehende Anfragen</p>
          {incomingRequests.map((request) => (
            <div
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]"
              key={request.id}
            >
              <span className="truncate text-sm font-semibold text-ink dark:text-zinc-50">
                {request.username}
              </span>
              <div className="flex gap-2">
                <form action={acceptFriendRequestAction.bind(null, request.id)}>
                  <Button aria-label="Annehmen" size="sm" type="submit" variant="secondary">
                    <Check aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </form>
                <form action={declineFriendRequestAction.bind(null, request.id)}>
                  <Button aria-label="Ablehnen" size="sm" type="submit" variant="ghost">
                    <X aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {outgoingRequests.length > 0 ? (
        <div className="mt-4 grid gap-2">
          <p className="text-sm font-semibold text-ink dark:text-zinc-50">Gesendet</p>
          {outgoingRequests.map((request) => (
            <div
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400"
              key={request.id}
            >
              {request.username}
            </div>
          ))}
        </div>
      ) : null}

      <form action={sendFriendRequestAction} className="mt-4 grid gap-3">
        <Input label="Username" name="username" placeholder="Username" />
        <SubmitButton className="w-full" pendingLabel="Sendet...">
          <UserPlus aria-hidden="true" className="h-4 w-4" />
          Anfrage senden
        </SubmitButton>
      </form>
    </Card>
  );
}

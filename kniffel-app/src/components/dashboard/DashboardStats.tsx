"use client";

import { useEffect, useState } from "react";

import { Radio, Trophy, UsersRound } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const FRIEND_PRESENCE_INTERVAL_MS = 10_000;

type PresenceFriendsResponse = {
  friends: {
    id: string;
    lastSeenAt: string;
    username: string;
  }[];
};

type FriendsPresenceEvent = CustomEvent<{
  onlineCount: number;
}>;

type DashboardStatsProps = {
  activeGames: number;
  friendsOnline: number;
  lobbyGames: number;
};

export function DashboardStats({
  activeGames,
  friendsOnline,
  lobbyGames
}: DashboardStatsProps) {
  const [liveFriendsOnline, setLiveFriendsOnline] = useState(friendsOnline);

  useEffect(() => {
    let active = true;

    async function refreshFriendsOnline() {
      if (!active || document.visibilityState !== "visible") {
        return;
      }

      try {
        const response = await fetch("/api/presence/friends", {
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as PresenceFriendsResponse;
        setLiveFriendsOnline(data.friends.length);
      } catch {
        // Dashboard presence is best-effort.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshFriendsOnline();
      }
    }

    function handleFriendsPresence(event: Event) {
      setLiveFriendsOnline((event as FriendsPresenceEvent).detail.onlineCount);
    }

    void refreshFriendsOnline();

    const intervalId = window.setInterval(() => {
      void refreshFriendsOnline();
    }, FRIEND_PRESENCE_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("kniffel:friends-presence", handleFriendsPresence);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("kniffel:friends-presence", handleFriendsPresence);
    };
  }, []);

  const stats = [
    { icon: Trophy, label: "Aktiv", value: activeGames },
    { icon: UsersRound, label: "Lobby", value: lobbyGames },
    {
      highlight: liveFriendsOnline > 0,
      href: "/social",
      icon: Radio,
      label: "Online",
      value: liveFriendsOnline
    }
  ];

  return (
    <section className="grid grid-cols-3 gap-2">
      {stats.map(({ highlight, href, icon: Icon, label, value }) => {
        const content = (
          <Card
            className={cn(
              "h-full p-3 shadow-sm sm:p-3.5",
              href ? "transition-transform hover:-translate-y-0.5" : null,
              highlight
                ? "border-emerald-500/50 bg-emerald-100/90 ring-1 ring-emerald-500/20 dark:border-emerald-300/35 dark:bg-emerald-300/15 dark:ring-emerald-300/20"
                : null
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-2 text-slate-500 dark:text-zinc-400",
                highlight ? "text-emerald-700 dark:text-emerald-200" : null
              )}
            >
              <p className="truncate text-[0.7rem] font-semibold uppercase sm:text-xs">{label}</p>
              <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            </div>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl dark:text-zinc-50",
                highlight ? "text-emerald-800 dark:text-emerald-100" : null
              )}
            >
              {value}
            </p>
          </Card>
        );

        return href ? (
          <Link aria-label={`${label} im Social Hub anzeigen`} href={href} key={label}>
            {content}
          </Link>
        ) : (
          <div key={label}>{content}</div>
        );
      })}
    </section>
  );
}

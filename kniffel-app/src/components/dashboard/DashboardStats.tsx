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
    inGame: boolean;
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
              "h-full !border-white/10 !bg-white/[0.09] p-3 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-3.5",
              href ? "transition-transform hover:-translate-y-0.5" : null,
              highlight
                ? "!border-brass/45 !bg-brass/15 ring-1 ring-brass/25"
                : null
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-2 text-emerald-50/65",
                highlight ? "text-amber-100" : null
              )}
            >
              <p className="truncate text-[0.7rem] font-semibold uppercase sm:text-xs">{label}</p>
              <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            </div>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl",
                highlight ? "text-amber-50" : null
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

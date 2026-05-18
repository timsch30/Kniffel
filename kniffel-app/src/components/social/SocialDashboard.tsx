"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";
import {
  Flame,
  Gauge,
  Medal,
  Swords,
  Trophy,
  UserRound,
  UsersRound
} from "lucide-react";

import { AchievementsPanel } from "@/components/social/AchievementsPanel";
import { FriendList } from "@/components/social/FriendList";
import { HeadToHeadCard } from "@/components/social/HeadToHeadCard";
import { Leaderboard } from "@/components/social/Leaderboard";
import { MetricTile } from "@/components/social/MetricTile";
import { PlayerProfileCard } from "@/components/social/PlayerProfileCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { SocialState } from "@/server/social/state";
import {
  calculateAchievements,
  calculateHeadToHeadStats,
  calculateLeaderboard,
  calculatePlayerStats,
  calculateRivalStats
} from "@/social/stats";
import type { Friend, Player, PlayerId } from "@/social/types";

type SocialDashboardProps = {
  acceptFriendRequestAction: (requestId: string) => void | Promise<void>;
  declineFriendRequestAction: (requestId: string) => void | Promise<void>;
  error?: string;
  removeFriendAction: (friendId: string) => void | Promise<void>;
  sendFriendRequestAction: (formData: FormData) => void | Promise<void>;
  socialState: SocialState;
  userId: string;
  userName: string;
};

type TabId = "friends" | "ranking" | "profile";

const currentPlayer: Player = {
  color: "bg-ink text-white dark:bg-white dark:text-zinc-950",
  id: "you",
  initials: "DU",
  name: "Du"
};

const tabs: { icon: typeof UsersRound; id: TabId; label: string }[] = [
  { icon: UsersRound, id: "friends", label: "Freunde" },
  { icon: Trophy, id: "ranking", label: "Ranking" },
  { icon: UserRound, id: "profile", label: "Profil" }
];

  const fallbackFriend: Friend = {
  color: "bg-slate-600 text-white",
  favoriteCategory: "Offen",
  inGame: false,
  id: "fallback",
  initials: "--",
  isOnline: false,
  lastActiveAt: new Date(0).toISOString(),
  lastSeenAt: null,
  name: "Offen",
  relationshipStatus: "accepted"
};

export function SocialDashboard({
  acceptFriendRequestAction,
  declineFriendRequestAction,
  error,
  removeFriendAction,
  sendFriendRequestAction,
  socialState,
  userId,
  userName
}: SocialDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("friends");
  const [selectedFriendId, setSelectedFriendId] = useState<PlayerId>(
    socialState.friends[0]?.id ?? ""
  );

  const user = useMemo<Player>(
    () => ({
      ...currentPlayer,
      id: userId,
      name: userName || currentPlayer.name
    }),
    [userId, userName]
  );
  const friends = socialState.friends;
  const games = socialState.games;
  const players = useMemo<Player[]>(() => [user, ...friends], [friends, user]);
  const selectedFriend =
    friends.find((friend) => friend.id === selectedFriendId) ??
    friends[0] ??
    fallbackFriend;
  const userStats = useMemo(() => calculatePlayerStats(games, user.id), [games, user.id]);
  const selectedFriendStats = useMemo(
    () => calculatePlayerStats(games, selectedFriend.id),
    [games, selectedFriend.id]
  );
  const headToHead = useMemo(
    () => calculateHeadToHeadStats(games, user, selectedFriend),
    [games, selectedFriend, user]
  );
  const leaderboard = useMemo(() => calculateLeaderboard(players, games), [games, players]);
  const achievements = useMemo(() => calculateAchievements(userStats), [userStats]);
  const rivals = useMemo(() => calculateRivalStats(games, user, friends), [friends, games, user]);

  return (
    <div className="grid min-w-0 gap-5 overflow-x-hidden text-white">
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <section className="grid gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-2">
            <Badge className="w-fit border-brass/40 bg-brass/20 text-amber-50" variant="accent">
              Social Stats
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Freunde, Rivalen, Fortschritt.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">
                Freunde verwalten und echte Runden im Blick behalten.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-80">
            <MetricTile icon={Trophy} label="Siege" value={userStats.gamesWon} />
            <MetricTile icon={Gauge} label="Schnitt" value={userStats.averagePoints} />
            <MetricTile icon={Flame} label="Serie" value={userStats.currentWinStreak} />
          </div>
        </div>

        <nav
          aria-label="Social Navigation"
          className="grid grid-cols-3 rounded-lg border border-white/10 bg-white/[0.08] p-1 shadow-sm backdrop-blur-xl"
        >
          {tabs.map(({ icon: Icon, id, label }) => {
            const active = activeTab === id;

            return (
              <button
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative isolate flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors sm:text-sm",
                  active
                    ? "!text-ink"
                    : "text-emerald-50/65 hover:text-white"
                )}
                key={id}
                onClick={() => setActiveTab(id)}
                type="button"
              >
                {active ? (
                  <motion.span
                    className="absolute inset-0 -z-10 rounded-md bg-brass shadow-sm"
                    layoutId="social-tab"
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  />
                ) : null}
                <Icon aria-hidden="true" className="h-4 w-4" />
                <span className="hidden min-[380px]:inline">{label}</span>
              </button>
            );
          })}
        </nav>
      </section>

      {activeTab === "friends" ? (
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <FriendList
            acceptFriendRequestAction={acceptFriendRequestAction}
            declineFriendRequestAction={declineFriendRequestAction}
            friends={friends}
            incomingRequests={socialState.incomingRequests}
            onSelect={setSelectedFriendId}
            outgoingRequests={socialState.outgoingRequests}
            removeFriendAction={removeFriendAction}
            selectedFriendId={selectedFriend?.id ?? ""}
            sendFriendRequestAction={sendFriendRequestAction}
          />
          <div className="grid gap-4">
            <PlayerProfileCard label="Freundesprofil" player={selectedFriend} stats={selectedFriendStats} />
            <HeadToHeadCard friend={selectedFriend} stats={headToHead} user={user} />
          </div>
        </motion.section>
      ) : null}

      {activeTab === "ranking" ? (
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 lg:grid-cols-[1fr_0.75fr]"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <Leaderboard entries={leaderboard} />
          <Card className="!border-white/10 !bg-white/[0.09] p-4 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Rivalen Radar
            </h2>
            <p className="mt-1 text-sm text-emerald-50/70">
              Nur die wichtigsten Social-Stats.
            </p>
            <div className="mt-4 grid gap-3">
              <MetricTile icon={Trophy} label="Meist geschlagen" value={rivals.mostBeatenFriend?.name ?? "Offen"} />
              <MetricTile icon={Swords} label="Deine Nemesis" value={rivals.nemesis?.name ?? "Offen"} />
              <MetricTile icon={Medal} label="Engster Rivale" value={rivals.closestRival?.name ?? "Offen"} />
            </div>
          </Card>
        </motion.section>
      ) : null}

      {activeTab === "profile" ? (
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid min-w-0 gap-4">
            <PlayerProfileCard player={user} stats={userStats} />
            <Card className="min-w-0 !border-white/10 !bg-white/[0.09] p-3 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-4">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Kniffel Stats
              </h2>
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:gap-3">
                <MetricTile label="Kniffel gesamt" value={userStats.totalKniffel} />
                <MetricTile label="Kniffel pro Spiel" value={userStats.kniffelPerGame} />
                <MetricTile label="Haeufigste Kategorie" value={userStats.favoriteCategory} />
                <MetricTile label="Staerkste Kategorie" value={userStats.bestCategory} />
              </div>
            </Card>
          </div>
          <div className="grid min-w-0 gap-4">
            <AchievementsPanel achievements={achievements} />
          </div>
        </motion.section>
      ) : null}
    </div>
  );
}

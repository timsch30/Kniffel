"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";
import {
  BarChart3,
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
import { RecentGames } from "@/components/social/RecentGames";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { SocialState } from "@/server/social/state";
import { currentPlayer, mockFriends, mockGames } from "@/social/mock-data";
import {
  calculateAchievements,
  calculateHeadToHeadStats,
  calculateLeaderboard,
  calculatePlayerStats,
  calculateRivalStats,
  getRecentGames
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

type TabId = "overview" | "friends" | "ranking" | "profile";

const tabs: { icon: typeof BarChart3; id: TabId; label: string }[] = [
  { icon: BarChart3, id: "overview", label: "Uebersicht" },
  { icon: UsersRound, id: "friends", label: "Freunde" },
  { icon: Trophy, id: "ranking", label: "Ranking" },
  { icon: UserRound, id: "profile", label: "Profil" }
];

const fallbackFriend: Friend = {
  color: "bg-slate-600 text-white",
  favoriteCategory: "Offen",
  id: "fallback",
  initials: "--",
  lastActiveAt: new Date(0).toISOString(),
  name: "Offen",
  relationshipStatus: "accepted"
};

function getFriendStats(friend: Friend) {
  return calculatePlayerStats(mockGames, friend.id);
}

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
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedFriendId, setSelectedFriendId] = useState<PlayerId>(
    socialState.friends[0]?.id ?? mockFriends[0]?.id ?? ""
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
  const statsFriends = friends.length > 0 ? friends : mockFriends;
  const players = useMemo<Player[]>(() => [user, ...statsFriends], [statsFriends, user]);
  const selectedFriend =
    statsFriends.find((friend) => friend.id === selectedFriendId) ??
    statsFriends[0] ??
    fallbackFriend;
  const userStats = useMemo(() => calculatePlayerStats(mockGames, user.id), [user.id]);
  const selectedFriendStats = useMemo(
    () => calculatePlayerStats(mockGames, selectedFriend.id),
    [selectedFriend.id]
  );
  const headToHead = useMemo(
    () => calculateHeadToHeadStats(mockGames, user, selectedFriend),
    [selectedFriend, user]
  );
  const leaderboard = useMemo(() => calculateLeaderboard(players, mockGames), [players]);
  const achievements = useMemo(() => calculateAchievements(userStats), [userStats]);
  const recentGames = useMemo(() => getRecentGames(mockGames, 5), []);
  const rivals = useMemo(() => calculateRivalStats(mockGames, user, mockFriends), [user]);

  return (
    <div className="grid gap-5">
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <section className="grid gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-2">
            <Badge className="w-fit" variant="accent">
              Social Stats
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
                Freunde, Rivalen, Fortschritt.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
                Ein kompakter Social-Hub fuer deine Kniffel-Runden. Aktuell mit Mock-Daten,
                backendfaehig strukturiert.
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
          className="grid grid-cols-4 rounded-lg border border-slate-200/80 bg-white/75 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
        >
          {tabs.map(({ icon: Icon, id, label }) => {
            const active = activeTab === id;

            return (
              <button
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative isolate flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors sm:text-sm",
                  active
                    ? "text-ink dark:text-zinc-950"
                    : "text-slate-500 hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100"
                )}
                key={id}
                onClick={() => setActiveTab(id)}
                type="button"
              >
                {active ? (
                  <motion.span
                    className="absolute inset-0 -z-10 rounded-md bg-white shadow-sm dark:bg-zinc-100"
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

      {activeTab === "overview" ? (
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 lg:grid-cols-[1fr_0.9fr]"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid gap-4">
            <PlayerProfileCard player={user} stats={userStats} />
            <HeadToHeadCard friend={selectedFriend} stats={headToHead} user={user} />
          </div>
          <div className="grid gap-4">
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
            <RecentGames games={recentGames} players={players} />
          </div>
        </motion.section>
      ) : null}

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
          <Card className="p-4">
            <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
              Rivalen Radar
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
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
          className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid gap-4">
            <PlayerProfileCard player={user} stats={userStats} />
            <Card className="p-4">
              <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
                Kniffel Stats
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricTile label="Kniffel gesamt" value={userStats.totalKniffel} />
                <MetricTile label="Kniffel pro Spiel" value={userStats.kniffelPerGame} />
                <MetricTile label="Haeufigste Kategorie" value={userStats.favoriteCategory} />
                <MetricTile label="Staerkste Kategorie" value={userStats.bestCategory} />
              </div>
            </Card>
          </div>
          <div className="grid gap-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
                Freundesvergleich
              </h2>
              <div className="mt-4 grid gap-2">
                {mockFriends.map((friend) => {
                  const stats = getFriendStats(friend);

                  return (
                    <button
                      className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                      key={friend.id}
                      onClick={() => {
                        setSelectedFriendId(friend.id);
                        setActiveTab("friends");
                      }}
                      type="button"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-ink dark:text-zinc-50">
                          {friend.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400">
                          {stats.gamesWon} Siege / {stats.averagePoints} Schnitt
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-felt dark:text-emerald-300">
                        Oeffnen
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
            <AchievementsPanel achievements={achievements} />
          </div>
        </motion.section>
      ) : null}
    </div>
  );
}

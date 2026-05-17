"use client";

import { useState } from "react";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Clipboard,
  Crown,
  FileText,
  Hourglass,
  Play,
  RotateCw,
  Save,
  Trash2,
  Trophy,
  UserPlus,
  UsersRound
} from "lucide-react";
import Link from "next/link";

import { CopyInviteLinkButton } from "@/components/game/CopyInviteLinkButton";
import { ScoreCardBlock } from "@/components/game/ScoreCardBlock";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  canUserManageCurrentTurn,
  getCurrentPlayer,
  getCurrentUserScoreCard,
  getFilledCategoryCount,
  getLeader,
  getNextPlayer,
  getPlayerByUserId,
  getPlayerScoreCard,
  isUserTurn
} from "@/game/game-state";
import { scoreCategories } from "@/game/scorecard";
import type { GameState } from "@/game/state";
import { cn } from "@/lib/cn";

type GameLobbyProps = {
  addGuestPlayerAction: () => void | Promise<void>;
  currentUserId: string;
  inviteFriendToGameAction: (formData: FormData) => void | Promise<void>;
  inviteLink: string;
  movePlayerAction: (playerId: string, direction: "up" | "down") => void | Promise<void>;
  onOpenTurn: () => void;
  removeGuestPlayerAction: (playerId: string) => void | Promise<void>;
  renamePlayerAction: (playerId: string, formData: FormData) => void | Promise<void>;
  restartGameAction: () => void | Promise<void>;
  startGameAction: () => void | Promise<void>;
  state: GameState;
};

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "accent";
type LobbyView = "overview" | "players" | "scores" | "blocks" | "status";

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Aktiv",
    FINISHED: "Beendet",
    LOBBY: "Lobby"
  };

  return labels[status] ?? status;
}

function statusVariant(status: string): BadgeVariant {
  if (status === "ACTIVE") {
    return "success";
  }

  if (status === "LOBBY") {
    return "warning";
  }

  return "neutral";
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function viewTitle(view: LobbyView): string {
  const titles: Record<LobbyView, string> = {
    blocks: "Bloecke",
    overview: "Uebersicht",
    players: "Mitspieler",
    scores: "Punktestaende",
    status: "Spielstatus"
  };

  return titles[view];
}

const lobbyTabs: Array<{ id: Exclude<LobbyView, "players">; label: string }> = [
  { id: "overview", label: "Uebersicht" },
  { id: "scores", label: "Punkte" },
  { id: "blocks", label: "Bloecke" },
  { id: "status", label: "Status" }
];

function MenuCard({
  icon: Icon,
  meta,
  onClick,
  title
}: {
  icon: typeof UsersRound;
  meta: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className="group flex min-h-24 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.08] p-4 text-left text-white shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-brass/35 hover:bg-white/[0.12]"
      onClick={onClick}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 text-emerald-50">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-white">{title}</span>
          <span className="mt-1 block truncate text-sm text-emerald-50/65">
            {meta}
          </span>
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-emerald-50/40 transition-transform group-hover:translate-x-0.5 group-hover:text-brass"
      />
    </button>
  );
}

export function GameLobby({
  addGuestPlayerAction,
  currentUserId,
  inviteFriendToGameAction,
  inviteLink,
  movePlayerAction,
  onOpenTurn,
  removeGuestPlayerAction,
  renamePlayerAction,
  restartGameAction,
  startGameAction,
  state
}: GameLobbyProps) {
  const [view, setView] = useState<LobbyView>("overview");
  const shouldReduceMotion = useReducedMotion();
  const currentPlayer = getCurrentPlayer(state);
  const currentUserPlayer = getPlayerByUserId(state, currentUserId);
  const currentUserScoreCard = getCurrentUserScoreCard(state, currentUserId);
  const leader = getLeader(state);
  const nextPlayer = getNextPlayer(state);
  const userTurn = isUserTurn(state, currentUserId);
  const canManageTurn = canUserManageCurrentTurn(state, currentUserId);
  const isOwner = state.ownerId === currentUserId;
  const canStart = isOwner && state.status === "LOBBY";
  const canStartNow = canStart && state.players.length >= 2;
  const userFilledCount = getFilledCategoryCount(currentUserScoreCard);
  const showFinishedView = state.status === "FINISHED";

  const detailHeader =
    view === "overview" ? null : (
      <div className="flex items-center gap-3">
        <button
          aria-label="Zurueck zur Uebersicht"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-emerald-50 shadow-sm transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.13]"
          onClick={() => setView("overview")}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <h2 className="truncate text-xl font-semibold tracking-tight text-white">
          {viewTitle(view)}
        </h2>
      </div>
    );

  return (
    <div className="grid gap-4 pb-24 sm:gap-5 sm:pb-6">
      <section className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.08] p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-5">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-brass/40" />
        <div className="flex items-center justify-between gap-3">
          <Link
            aria-label="Zum Dashboard"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-emerald-50 shadow-sm transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.13]"
            href="/dashboard"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(state.status)}>{formatStatus(state.status)}</Badge>
              {userTurn ? (
                <Badge variant="success">Du bist dran</Badge>
              ) : canManageTurn && isOwner ? (
                <Badge variant="success">Admin verwaltet</Badge>
              ) : null}
            </div>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
              {state.name}
            </h1>
          </div>
          <div className="shrink-0 rounded-lg border border-brass/30 bg-brass/95 px-3 py-2 text-right text-emerald-950 shadow-[0_12px_30px_rgba(244,185,66,0.18)]">
            <p className="text-[0.68rem] font-semibold uppercase opacity-70">Runde</p>
            <p className="text-base font-semibold tabular-nums">{state.roundNumber}</p>
          </div>
        </div>
      </section>

      {!showFinishedView && state.status === "ACTIVE" ? (
        <nav
          aria-label="Lobby-Ansichten"
          className="rounded-lg border border-white/10 bg-white/[0.07] p-1 shadow-sm backdrop-blur-xl"
        >
          <div className="grid grid-cols-4 gap-1">
            {lobbyTabs.map((tab) => {
              const active = view === tab.id;

              return (
                <button
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative min-h-10 overflow-hidden rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm",
                    active
                      ? "text-white"
                      : "text-emerald-50/50 hover:text-white"
                  )}
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  type="button"
                >
                  {active ? (
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg border border-brass/25 bg-white/[0.11] shadow-sm"
                      layoutId="lobby-active-view"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.01 }
                          : { damping: 28, stiffness: 420, type: "spring" }
                      }
                    />
                  ) : null}
                  <span className="relative truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}

      {state.winner && showFinishedView ? (
        <section className="relative overflow-hidden rounded-lg border border-brass/25 bg-[linear-gradient(145deg,rgba(244,185,66,0.14),rgba(6,78,59,0.48),rgba(2,23,19,0.86))] p-4 text-white shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-6">
          <motion.div
            aria-hidden="true"
            animate={
              shouldReduceMotion
                ? { opacity: 0.2 }
                : { opacity: [0.12, 0.28, 0.12], scale: [0.96, 1.04, 0.96] }
            }
            className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass/25 blur-3xl"
            transition={
              shouldReduceMotion
                ? { duration: 0.01 }
                : { duration: 3.6, ease: "easeInOut", repeat: Infinity }
            }
          />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(18rem,1.1fr)] lg:items-start">
            <div className="grid gap-4">
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="grid place-items-start gap-3"
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 8 }}
                transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24 }}
              >
                <div className="grid h-14 w-14 place-items-center rounded-lg border border-brass/35 bg-brass/15 text-brass shadow-[0_18px_44px_rgba(244,185,66,0.16)]">
                  <Trophy aria-hidden="true" className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-brass">Spiel beendet</p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {state.winner.displayName}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-emerald-50/70">
                    gewinnt diese Runde mit {state.winner.total} Punkten.
                  </p>
                </div>
              </motion.div>
              <div className="flex flex-wrap gap-2">
                {isOwner ? (
                  <form action={restartGameAction}>
                    <SubmitButton pendingLabel="Startet neu...">
                      <RotateCw aria-hidden="true" className="h-4 w-4" />
                      Neue Runde
                    </SubmitButton>
                  </form>
                ) : (
                  <Link className={buttonVariants("primary")} href="/games/new">
                    <RotateCw aria-hidden="true" className="h-4 w-4" />
                    Neue Runde
                  </Link>
                )}
                <Link className={buttonVariants("secondary")} href="/dashboard">
                  Zum Dashboard
                </Link>
              </div>
            </div>

            <div className="grid gap-2">
              <p className="px-1 text-xs font-bold uppercase text-emerald-50/60">Endstand</p>
              {state.ranking.map((entry, index) => {
                const active = entry.isCurrentPlayer;
                const winner = entry.playerId === state.winner?.playerId;

                return (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-3 text-sm shadow-sm backdrop-blur-xl",
                      winner
                        ? "border-brass/45 bg-brass/[0.16] text-amber-50"
                        : active
                          ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-50"
                          : "border-white/10 bg-white/[0.07] text-emerald-50/80"
                    )}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    key={entry.playerId}
                    layout="position"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.01 }
                        : { delay: index * 0.04, duration: 0.2 }
                    }
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-lg border text-sm font-bold tabular-nums",
                        winner
                          ? "border-brass/45 bg-brass text-emerald-950"
                          : "border-white/10 bg-white/10 text-emerald-50"
                      )}
                    >
                      {entry.rank}
                    </span>
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        {winner ? <Crown aria-hidden="true" className="h-4 w-4 shrink-0 text-brass" /> : null}
                        <span className="truncate font-semibold">{entry.displayName}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-emerald-50/55">
                        {active ? "aktueller Spieler" : `Position ${entry.position}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-right font-semibold tabular-nums">
                      {entry.total}
                      <span className="block text-[0.68rem] font-medium text-emerald-50/55">
                        Punkte
                      </span>
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {showFinishedView ? (
        <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.08] p-4 text-white shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 text-emerald-50">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Bloecke</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {state.players.map((player) => {
              const scoreCard = getPlayerScoreCard(state, player.id);
              const own = player.id === currentUserPlayer?.id;

              return (
                <details
                  className="group rounded-lg border border-white/10 bg-white/[0.07] p-4 shadow-sm open:border-brass/30 open:bg-white/[0.1] open:shadow-[0_18px_58px_rgba(0,0,0,0.22)]"
                  key={player.id}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {player.displayName}
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-50/60">
                        {own ? "Dein Block" : "Block"}
                      </p>
                    </div>
                    <Badge variant={own ? "accent" : "neutral"}>
                      {getFilledCategoryCount(scoreCard)}/{scoreCategories.length}
                    </Badge>
                  </summary>
                  <ScoreCardBlock className="mt-4" compact scoreCard={scoreCard} />
                </details>
              );
            })}
          </div>
        </section>
      ) : null}

      {!showFinishedView && view === "overview" ? (
        <>
          {state.status === "ACTIVE" ? (
            <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.08] p-4 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-brass">
                    Am Zug
                  </p>
                  <p className="mt-1 truncate text-lg font-semibold text-white">
                    {currentPlayer?.displayName ?? "Unbekannt"}
                  </p>
                  <p className="mt-0.5 text-sm text-emerald-50/60">
                    Danach: {nextPlayer?.displayName ?? "offen"}
                  </p>
                </div>
                {leader ? (
                  <div className="shrink-0 rounded-lg border border-brass/20 bg-brass/[0.12] px-3 py-2 text-right">
                    <p className="flex items-center justify-end gap-1 text-xs font-semibold text-amber-100">
                      <Crown aria-hidden="true" className="h-3.5 w-3.5" />
                      Fuehrt
                    </p>
                    <p className="mt-0.5 max-w-28 truncate text-sm font-semibold text-white">
                      {leader.displayName}
                    </p>
                  </div>
                ) : null}
              </div>

                {state.status === "ACTIVE" ? (
                <Button className="min-h-12 w-full sm:w-fit" onClick={onOpenTurn} type="button">
                  Spielmodus oeffnen
                </Button>
              ) : null}
            </section>
          ) : null}

          {state.status === "LOBBY" ? (
            <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.08] p-4 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <UsersRound
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 text-emerald-50/60"
                />
                <div className="grid gap-1">
                  <p className="text-sm font-semibold text-white">
                    {state.players.length} Spieler in der Lobby
                  </p>
                  <p className="text-sm text-emerald-50/60">
                    Zum Start werden mindestens 2 Spieler benoetigt.
                  </p>
                </div>
              </div>

              {canStart ? (
                <form action={startGameAction}>
                  <SubmitButton
                    className="w-full min-h-12"
                    disabled={!canStartNow}
                    pendingLabel="Startet..."
                  >
                    <Play aria-hidden="true" className="h-4 w-4" />
                    Runde starten
                  </SubmitButton>
                </form>
              ) : (
                <Alert variant="info">
                  <span className="inline-flex items-center gap-2">
                    <Hourglass aria-hidden="true" className="h-4 w-4" />
                    Warte auf den Host.
                  </span>
                </Alert>
              )}

              {isOwner ? (
                <form action={addGuestPlayerAction}>
                  <SubmitButton className="w-full min-h-12" pendingLabel="Fuegt hinzu...">
                    <UserPlus aria-hidden="true" className="h-4 w-4" />
                    Gastspieler hinzufuegen
                  </SubmitButton>
                </form>
              ) : null}

              <div className="grid gap-2">
                {state.players.map((player, index) => (
                  <div
                    className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    key={player.id}
                  >
                    <div className="min-w-0 grid gap-2">
                      <p className="text-xs font-semibold text-emerald-50/55">
                        Position {player.position}
                        {player.userId === null ? " / Gast" : ""}
                      </p>
                      {isOwner ? (
                        <form
                          action={renamePlayerAction.bind(null, player.id)}
                          className="flex min-w-0 gap-2"
                        >
                          <input
                            aria-label={`${player.displayName} umbenennen`}
                            className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-sm font-semibold text-white outline-none transition-colors placeholder:text-emerald-50/40 focus:border-brass/70 focus:ring-4 focus:ring-brass/15"
                            defaultValue={player.displayName}
                            maxLength={30}
                            name="displayName"
                            required
                            type="text"
                          />
                          <SubmitButton
                            className="min-h-10 px-3 py-2"
                            pendingLabel="..."
                          >
                            <Save aria-hidden="true" className="h-4 w-4" />
                            <span className="sr-only">Speichern</span>
                          </SubmitButton>
                        </form>
                      ) : (
                        <p className="truncate font-semibold text-white">
                          {player.displayName}
                        </p>
                      )}
                    </div>
                    {isOwner ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        <form action={movePlayerAction.bind(null, player.id, "up")}>
                          <Button
                            aria-label={`${player.displayName} nach oben`}
                            disabled={index === 0}
                            size="sm"
                            type="submit"
                            variant="secondary"
                          >
                            <ArrowUp aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        </form>
                        <form action={movePlayerAction.bind(null, player.id, "down")}>
                          <Button
                            aria-label={`${player.displayName} nach unten`}
                            disabled={index === state.players.length - 1}
                            size="sm"
                            type="submit"
                            variant="secondary"
                          >
                            <ArrowDown aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        </form>
                        {player.userId === null ? (
                          <form action={removeGuestPlayerAction.bind(null, player.id)}>
                            <Button
                              aria-label={`${player.displayName} entfernen`}
                              size="sm"
                              type="submit"
                              variant="danger"
                            >
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {state.status === "LOBBY" ? (
            <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.08] p-4 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 text-emerald-50">
                  <Clipboard aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Einladung</h2>
                </div>
              </div>
              <div className="grid gap-3 rounded-lg border border-white/10 bg-black/15 p-4">
                <p className="break-all font-mono text-2xl font-semibold tracking-tight text-white">
                  {state.inviteCode}
                </p>
                <p className="break-all text-sm text-emerald-50/60">{inviteLink}</p>
                <CopyInviteLinkButton inviteLink={inviteLink} />
              </div>

              {currentUserPlayer ? (
                <div className="grid gap-3 rounded-lg border border-white/10 bg-black/15 p-4">
                  <div>
                    <h3 className="font-semibold text-white">
                      Freunde einladen
                    </h3>
                    <p className="mt-1 text-sm text-emerald-50/60">
                      Nur bestehende Freunde koennen eingeladen werden.
                    </p>
                  </div>

                  {state.friendInvites.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.05] p-4 text-sm text-emerald-50/60">
                      Keine Freunde vorhanden.
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {state.friendInvites.map((friend) => {
                        const alreadyInvited = friend.status === "PENDING";
                        const accepted = friend.status === "ACCEPTED" || friend.status === "IN_GAME";
                        const disabled = alreadyInvited || accepted;

                        return (
                          <div
                            className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2"
                            key={friend.id}
                          >
                            <span className="min-w-0 truncate text-sm font-semibold text-white">
                              {friend.username}
                            </span>
                            {accepted ? (
                              <Badge variant="success">
                                {friend.status === "IN_GAME" ? "In Runde" : "Angenommen"}
                              </Badge>
                            ) : alreadyInvited ? (
                              <Badge variant="warning">Offen</Badge>
                            ) : (
                              <form action={inviteFriendToGameAction}>
                                <input name="gameId" type="hidden" value={state.gameId} />
                                <input name="friendId" type="hidden" value={friend.id} />
                                <SubmitButton
                                  className="min-h-9 px-3 py-2 text-xs"
                                  disabled={disabled}
                                  pendingLabel="Sendet..."
                                >
                                  <UserPlus aria-hidden="true" className="h-4 w-4" />
                                  Einladen
                                </SubmitButton>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          ) : null}

          {state.status === "ACTIVE" ? (
            <section className="grid gap-3 sm:grid-cols-2">
              <MenuCard
                icon={Trophy}
                meta={leader ? `${leader.displayName}: ${leader.total}` : "Noch keine Fuehrung"}
                onClick={() => setView("scores")}
                title="Punktestaende"
              />
              <MenuCard
                icon={FileText}
                meta={
                  currentUserScoreCard
                    ? `Dein Block ${userFilledCount}/${scoreCategories.length}`
                    : "Alle Bloecke"
                }
                onClick={() => setView("blocks")}
                title="Bloecke"
              />
              <MenuCard
                icon={RotateCw}
                meta={currentPlayer ? `${currentPlayer.displayName} ist dran` : "Noch offen"}
                onClick={() => setView("status")}
                title="Spielstatus"
              />
            </section>
          ) : null}
        </>
      ) : !showFinishedView ? (
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.08] p-4 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.18 }}
        >
          {detailHeader}

          {view === "players" ? (
            <div className="grid gap-2">
              {state.players.map((player, index) => {
                const active = player.id === state.currentPlayerId;
                const own = player.id === currentUserPlayer?.id;

                return (
                  <div
                    className={cn(
                      "rounded-lg border px-4 py-3 transition-colors",
                      active
                        ? "border-brass/35 bg-brass/[0.12] text-amber-50"
                        : "border-white/10 bg-white/[0.07] text-emerald-50"
                    )}
                    key={player.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-emerald-50/55">
                          Position {player.position}
                        </p>
                        <p className="mt-1 truncate font-semibold">{player.displayName}</p>
                      </div>
                      <Badge variant={active ? "success" : own ? "accent" : "neutral"}>
                        {active ? "am Zug" : own ? "du" : "wartet"}
                      </Badge>
                    </div>
                    {isOwner && state.status === "LOBBY" ? (
                      <div className="mt-3 flex gap-2">
                        <form action={movePlayerAction.bind(null, player.id, "up")}>
                          <Button
                            aria-label={`${player.displayName} nach oben`}
                            disabled={index === 0}
                            size="sm"
                            type="submit"
                            variant="secondary"
                          >
                            <ArrowUp aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        </form>
                        <form action={movePlayerAction.bind(null, player.id, "down")}>
                          <Button
                            aria-label={`${player.displayName} nach unten`}
                            disabled={index === state.players.length - 1}
                            size="sm"
                            type="submit"
                            variant="secondary"
                          >
                            <ArrowDown aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {view === "scores" ? (
            <div className="grid gap-2">
              {state.ranking.map((entry, index) => {
                const active = entry.isCurrentPlayer;

                return (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-lg border px-4 py-3 transition-colors",
                      active
                        ? "border-brass/35 bg-brass/[0.12]"
                        : "border-white/10 bg-white/[0.07]"
                    )}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    key={entry.playerId}
                    layout="position"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.01 }
                        : { delay: index * 0.025, duration: 0.18 }
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          #{entry.rank} {entry.displayName}
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-50/55">
                          {active ? "am Zug" : `Position ${entry.position}`}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-semibold tabular-nums text-white">
                        {entry.total}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : null}

          {view === "blocks" ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {state.players.map((player) => {
                const scoreCard = getPlayerScoreCard(state, player.id);
                const own = player.id === currentUserPlayer?.id;

                return (
                  <details
                    className="group rounded-lg border border-white/10 bg-white/[0.07] p-4 shadow-sm open:border-brass/30 open:bg-white/[0.1] open:shadow-[0_18px_58px_rgba(0,0,0,0.22)]"
                    key={player.id}
                    open={own}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {player.displayName}
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-50/55">
                          {own ? "Dein Block" : `${scoreCard?.total ?? 0} Punkte`}
                        </p>
                      </div>
                      <Badge variant={own ? "accent" : "neutral"}>
                        {getFilledCategoryCount(scoreCard)}/{scoreCategories.length}
                      </Badge>
                    </summary>
                    <ScoreCardBlock className="mt-4" compact scoreCard={scoreCard} />
                  </details>
                );
              })}
            </div>
          ) : null}

          {view === "status" ? (
            <div className="grid gap-2 text-sm text-emerald-50/65">
              <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
                <p className="font-semibold text-white">Aktuell</p>
                <p className="mt-1">{currentPlayer?.displayName ?? "offen"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
                <p className="font-semibold text-white">Fuehrung</p>
                <p className="mt-1">
                  {leader ? `${leader.displayName} (${leader.total})` : "offen"}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
                <p className="font-semibold text-white">Letzte Aktion</p>
                <p className="mt-1">
                  {state.lastAction
                    ? `${state.lastAction.displayName}, ${formatTime(state.lastAction.createdAt)}`
                    : "noch keine"}
                </p>
              </div>
            </div>
          ) : null}
        </motion.section>
      ) : null}

      {canManageTurn ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-emerald-950/92 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_44px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brass">
                {userTurn ? "Du bist dran" : "Admin verwaltet"}
              </p>
              <p className="truncate text-sm font-semibold text-white">
                {currentPlayer ? `${currentPlayer.displayName} eintragen` : "Zug fortsetzen"}
              </p>
            </div>
            <Button className="min-h-12 px-6" onClick={onOpenTurn} type="button">
              Oeffnen
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

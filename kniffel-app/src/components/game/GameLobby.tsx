"use client";

import { useState } from "react";

import { motion } from "framer-motion";
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
  currentUserId: string;
  inviteFriendToGameAction: (formData: FormData) => void | Promise<void>;
  inviteLink: string;
  movePlayerAction: (playerId: string, direction: "up" | "down") => void | Promise<void>;
  onOpenTurn: () => void;
  restartGameAction: () => void | Promise<void>;
  startGameAction: () => void | Promise<void>;
  state: GameState;
};

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "accent";
type LobbyView = "overview" | "players" | "scores" | "blocks" | "invite" | "status";

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
    invite: "Einladung",
    overview: "Uebersicht",
    players: "Mitspieler",
    scores: "Punktestaende",
    status: "Spielstatus"
  };

  return titles[view];
}

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
      className="group flex min-h-24 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/85 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
      onClick={onClick}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-200">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink dark:text-zinc-50">{title}</span>
          <span className="mt-1 block truncate text-sm text-slate-500 dark:text-zinc-400">
            {meta}
          </span>
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-500"
      />
    </button>
  );
}

export function GameLobby({
  currentUserId,
  inviteFriendToGameAction,
  inviteLink,
  movePlayerAction,
  onOpenTurn,
  restartGameAction,
  startGameAction,
  state
}: GameLobbyProps) {
  const [view, setView] = useState<LobbyView>("overview");
  const currentPlayer = getCurrentPlayer(state);
  const currentUserPlayer = getPlayerByUserId(state, currentUserId);
  const currentUserScoreCard = getCurrentUserScoreCard(state, currentUserId);
  const leader = getLeader(state);
  const nextPlayer = getNextPlayer(state);
  const userTurn = isUserTurn(state, currentUserId);
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
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-white/10 dark:text-zinc-50"
          onClick={() => setView("overview")}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <h2 className="truncate text-xl font-semibold tracking-tight text-ink dark:text-zinc-50">
          {viewTitle(view)}
        </h2>
      </div>
    );

  return (
    <div className="grid gap-4 pb-24 sm:gap-5 sm:pb-6">
      <section className="rounded-lg border border-slate-200/80 bg-white/90 p-4 shadow-card backdrop-blur-xl sm:p-5 dark:border-white/10 dark:bg-zinc-900/75 dark:shadow-card-dark">
        <div className="flex items-center justify-between gap-3">
          <Link
            aria-label="Zum Dashboard"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-white/10 dark:text-zinc-50"
            href="/dashboard"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(state.status)}>{formatStatus(state.status)}</Badge>
              {userTurn ? <Badge variant="success">Du bist dran</Badge> : null}
            </div>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink dark:text-zinc-50">
              {state.name}
            </h1>
          </div>
          <div className="shrink-0 rounded-lg bg-ink px-3 py-2 text-right text-white dark:bg-white dark:text-zinc-950">
            <p className="text-[0.68rem] font-semibold uppercase opacity-70">Runde</p>
            <p className="text-base font-semibold tabular-nums">{state.roundNumber}</p>
          </div>
        </div>
      </section>

      {state.winner && showFinishedView ? (
        <section className="rounded-lg border border-amber-300/50 bg-amber-50 p-4 shadow-card dark:border-amber-300/20 dark:bg-amber-300/10">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-amber-700 shadow-sm dark:bg-white/10 dark:text-amber-100">
              <Trophy aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="grid flex-1 gap-3">
              <p className="text-sm leading-6 text-amber-950 dark:text-amber-50">
                Gewinner: <span className="font-semibold">{state.winner.displayName}</span>
              </p>
              <div className="grid gap-2">
                <p className="text-xs font-bold uppercase text-amber-800 dark:text-amber-100">
                  Endstand
                </p>
                <div className="grid gap-1.5">
                  {state.ranking.map((entry) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-lg border border-amber-200/70 bg-white/70 px-3 py-2 text-sm dark:border-amber-200/10 dark:bg-white/10"
                      key={entry.playerId}
                    >
                      <span className="min-w-0 truncate font-semibold text-amber-950 dark:text-amber-50">
                        {entry.rank}. {entry.displayName}
                      </span>
                      <span className="shrink-0 tabular-nums text-amber-950 dark:text-amber-50">
                        {entry.total} Punkte
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
          </div>
        </section>
      ) : null}

      {showFinishedView ? (
        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-200">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-ink dark:text-zinc-50">Bloecke</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {state.players.map((player) => {
              const scoreCard = getPlayerScoreCard(state, player.id);
              const own = player.id === currentUserPlayer?.id;

              return (
                <details
                  className="group rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm open:shadow-card dark:border-white/10 dark:bg-white/5 dark:open:shadow-card-dark"
                  key={player.id}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink dark:text-zinc-50">
                        {player.displayName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
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
            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
                    Am Zug
                  </p>
                  <p className="mt-1 truncate text-lg font-semibold text-ink dark:text-zinc-50">
                    {currentPlayer?.displayName ?? "Unbekannt"}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
                    Danach: {nextPlayer?.displayName ?? "offen"}
                  </p>
                </div>
                {leader ? (
                  <div className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-right dark:bg-white/10">
                    <p className="flex items-center justify-end gap-1 text-xs font-semibold text-amber-700 dark:text-amber-200">
                      <Crown aria-hidden="true" className="h-3.5 w-3.5" />
                      Fuehrt
                    </p>
                    <p className="mt-0.5 max-w-28 truncate text-sm font-semibold text-ink dark:text-zinc-50">
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
            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <UsersRound
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 text-slate-500 dark:text-zinc-400"
                />
                <div className="grid gap-1">
                  <p className="text-sm font-semibold text-ink dark:text-zinc-50">
                    {state.players.length} Spieler in der Lobby
                  </p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
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

              <div className="grid gap-2">
                {state.players.map((player, index) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                    key={player.id}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                        Position {player.position}
                      </p>
                      <p className="truncate font-semibold text-ink dark:text-zinc-50">
                        {player.displayName}
                      </p>
                    </div>
                    {isOwner ? (
                      <div className="flex gap-2">
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
                ))}
              </div>
            </section>
          ) : null}

          {state.status === "LOBBY" ? (
            <section className="grid gap-4 rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-200">
                  <Clipboard aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-ink dark:text-zinc-50">Einladung</h2>
                </div>
              </div>
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="break-all font-mono text-2xl font-semibold tracking-tight text-ink dark:text-zinc-50">
                  {state.inviteCode}
                </p>
                <p className="break-all text-sm text-slate-500 dark:text-zinc-400">{inviteLink}</p>
                <CopyInviteLinkButton inviteLink={inviteLink} />
              </div>

              {currentUserPlayer ? (
                <div className="grid gap-3 rounded-lg border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <h3 className="font-semibold text-ink dark:text-zinc-50">
                      Freunde einladen
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                      Nur bestehende Freunde koennen eingeladen werden.
                    </p>
                  </div>

                  {state.friendInvites.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
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
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                            key={friend.id}
                          >
                            <span className="min-w-0 truncate text-sm font-semibold text-ink dark:text-zinc-50">
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
                icon={Clipboard}
                meta={state.inviteCode}
                onClick={() => setView("invite")}
                title="Einladung"
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
          className="grid gap-4 rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
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
                        ? "border-emerald-500/35 bg-emerald-50 text-emerald-950 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-50"
                        : "border-slate-200 bg-white/80 text-ink dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                    )}
                    key={player.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
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
                        ? "border-emerald-500/30 bg-emerald-50 dark:border-emerald-300/30 dark:bg-emerald-300/10"
                        : "border-slate-200 bg-white/85 dark:border-white/10 dark:bg-white/5"
                    )}
                    initial={{ opacity: 0, y: 6 }}
                    key={entry.playerId}
                    transition={{ delay: index * 0.025, duration: 0.18 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink dark:text-zinc-50">
                          #{entry.rank} {entry.displayName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                          {active ? "am Zug" : `Position ${entry.position}`}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-semibold tabular-nums text-ink dark:text-zinc-100">
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
                    className="group rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm open:shadow-card dark:border-white/10 dark:bg-white/5 dark:open:shadow-card-dark"
                    key={player.id}
                    open={own}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink dark:text-zinc-50">
                          {player.displayName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
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

          {view === "invite" ? (
            <div className="grid gap-4">
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="break-all font-mono text-2xl font-semibold tracking-tight text-ink dark:text-zinc-50">
                  {state.inviteCode}
                </p>
                <p className="break-all text-sm text-slate-500 dark:text-zinc-400">{inviteLink}</p>
                <CopyInviteLinkButton inviteLink={inviteLink} />
              </div>

              {currentUserPlayer && state.status === "LOBBY" ? (
                <div className="grid gap-3 rounded-lg border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <h3 className="font-semibold text-ink dark:text-zinc-50">
                      Freunde einladen
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                      Nur bestehende Freunde koennen eingeladen werden.
                    </p>
                  </div>

                  {state.friendInvites.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
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
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                            key={friend.id}
                          >
                            <span className="min-w-0 truncate text-sm font-semibold text-ink dark:text-zinc-50">
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
            </div>
          ) : null}

          {view === "status" ? (
            <div className="grid gap-2 text-sm text-slate-600 dark:text-zinc-400">
              <div className="rounded-lg border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="font-semibold text-ink dark:text-zinc-50">Aktuell</p>
                <p className="mt-1">{currentPlayer?.displayName ?? "offen"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="font-semibold text-ink dark:text-zinc-50">Fuehrung</p>
                <p className="mt-1">
                  {leader ? `${leader.displayName} (${leader.total})` : "offen"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="font-semibold text-ink dark:text-zinc-50">Letzte Aktion</p>
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

      {userTurn ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_44px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:hidden dark:border-white/10 dark:bg-zinc-950/95">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Du bist dran
              </p>
              <p className="truncate text-sm font-semibold text-ink dark:text-zinc-50">
                Zug fortsetzen
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

"use client";

import { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Dices, FilePenLine, Smartphone, Trophy, X } from "lucide-react";

import { ScoreCardBlock } from "@/components/game/ScoreCardBlock";
import { ScoreEntryForm } from "@/components/game/ScoreEntryForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getFilledCategoryCount, getNextPlayer, getPlayerScoreCard, isUserTurn } from "@/game/game-state";
import { scoreCategories } from "@/game/scorecard";
import type { GameState } from "@/game/state";
import { cn } from "@/lib/cn";

type GameTurnScreenProps = {
  currentUserId: string;
  enterScoreAction: (formData: FormData) => void | Promise<void>;
  onBackToLobby: () => void;
  onSaved: () => void;
  state: GameState;
};

type TurnFeedback = {
  id: number;
  leaderName?: string;
  nextIsCurrentUser: boolean;
  nextPlayerName: string;
  roundNumber: number;
};

export function GameTurnScreen({
  currentUserId,
  enterScoreAction,
  onBackToLobby,
  onSaved,
  state
}: GameTurnScreenProps) {
  const [entryOpen, setEntryOpen] = useState(false);
  const [rollMode, setRollMode] = useState<"real" | "online" | null>(null);
  const [showRollModePicker, setShowRollModePicker] = useState(false);
  const [turnFeedback, setTurnFeedback] = useState<TurnFeedback | null>(null);
  const [viewedPlayerId, setViewedPlayerId] = useState(
    () =>
      state.currentPlayerId ??
      state.players.find((player) => player.userId === currentUserId)?.id ??
      state.players[0]?.id ??
      ""
  );
  const playerCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const playerRowRef = useRef<HTMLDivElement | null>(null);
  const previousCurrentPlayerIdRef = useRef(state.currentPlayerId);
  const hasInitialAutoScrollRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);
  const turnFeedbackTimeoutRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const currentPlayer = state.players.find((player) => player.id === state.currentPlayerId);
  const viewedPlayer = state.players.find((player) => player.id === viewedPlayerId);
  const viewedPlayerScoreCard = viewedPlayer ? getPlayerScoreCard(state, viewedPlayer.id) : null;
  const currentUserPlayer = state.players.find((player) => player.userId === currentUserId);
  const currentUserScoreCard = currentUserPlayer
    ? getPlayerScoreCard(state, currentUserPlayer.id)
    : null;
  const userTurn = isUserTurn(state, currentUserId);
  const filledCount = getFilledCategoryCount(currentUserScoreCard);
  const viewedTotal = viewedPlayerScoreCard?.total ?? 0;

  function updateViewedPlayerFromScroll() {
    const playerRow = playerRowRef.current;

    if (!playerRow) {
      return;
    }

    const rowRect = playerRow.getBoundingClientRect();
    const rowCenter = rowRect.left + rowRect.width / 2;
    let nearestPlayerId = viewedPlayerId;
    let nearestDistance = Number.POSITIVE_INFINITY;

    state.players.forEach((player) => {
      const card = playerCardRefs.current[player.id];

      if (!card) {
        return;
      }

      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - rowCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlayerId = player.id;
      }
    });

    if (nearestPlayerId && nearestPlayerId !== viewedPlayerId) {
      setViewedPlayerId(nearestPlayerId);
    }
  }

  function handlePlayerRowScroll() {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      updateViewedPlayerFromScroll();
      scrollFrameRef.current = null;
    });
  }

  function showSavedFeedback() {
    const nextPlayer = getNextPlayer(state);

    if (turnFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(turnFeedbackTimeoutRef.current);
    }

    setTurnFeedback({
      id: Date.now(),
      leaderName: state.ranking[0]?.displayName,
      nextIsCurrentUser: nextPlayer?.userId === currentUserId,
      nextPlayerName: nextPlayer?.displayName ?? "naechster Spieler",
      roundNumber: state.roundNumber
    });

    turnFeedbackTimeoutRef.current = window.setTimeout(() => {
      setTurnFeedback(null);
      turnFeedbackTimeoutRef.current = null;
    }, shouldReduceMotion ? 1000 : 1350);
  }

  useEffect(() => {
    const playerChanged = previousCurrentPlayerIdRef.current !== state.currentPlayerId;

    if (!playerChanged && hasInitialAutoScrollRef.current) {
      return;
    }

    previousCurrentPlayerIdRef.current = state.currentPlayerId;
    hasInitialAutoScrollRef.current = true;

    const frameId = window.requestAnimationFrame(() => {
      if (!state.currentPlayerId) {
        return;
      }

      const activeCard = playerCardRefs.current[state.currentPlayerId];
      const playerRow = playerRowRef.current;

      if (!activeCard || !playerRow) {
        return;
      }

      const maxScrollLeft = Math.max(0, playerRow.scrollWidth - playerRow.clientWidth);
      const centeredLeft =
        activeCard.offsetLeft - (playerRow.clientWidth - activeCard.offsetWidth) / 2;
      const nextLeft = Math.min(Math.max(centeredLeft, 0), maxScrollLeft);

      setViewedPlayerId(state.currentPlayerId);

      playerRow.scrollTo({
        behavior: "smooth",
        left: nextLeft
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [state.currentPlayerId]);

  useEffect(() => {
    if (userTurn && !rollMode) {
      setShowRollModePicker(true);
    }
  }, [rollMode, userTurn]);

  useEffect(() => {
    if (state.players.some((player) => player.id === viewedPlayerId)) {
      return;
    }

    setViewedPlayerId(state.currentPlayerId ?? state.players[0]?.id ?? "");
  }, [state.currentPlayerId, state.players, viewedPlayerId]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }

      if (turnFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(turnFeedbackTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="relative -mx-4 min-h-[100svh] overflow-hidden px-4 pb-32 pt-3 text-white sm:mx-0 sm:min-h-[calc(100svh-2rem)] sm:rounded-lg sm:border sm:border-white/10 sm:bg-white/[0.06] sm:p-5 sm:pb-32 sm:shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(244,185,66,0.14),transparent_28rem),radial-gradient(circle_at_15%_18%,rgba(16,185,129,0.15),transparent_24rem)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(white_1px,transparent_1px)] [background-size:32px_32px]"
      />
      <div className="grid gap-4">
        <div className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-emerald-950/90 px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:static sm:mx-0 sm:rounded-lg sm:border sm:bg-white/[0.08]">
          <div className="flex items-center justify-between gap-3">
            <button
              aria-label="Zurueck zur Uebersicht"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-emerald-50 shadow-sm transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.13]"
              onClick={onBackToLobby}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold tracking-tight text-white">
                {state.name}
              </h1>
              <p className="mt-0.5 text-sm font-medium text-emerald-100/80">
                Am Zug: {currentPlayer?.displayName ?? "offen"}
              </p>
            </div>
            <div className="shrink-0 rounded-lg border border-brass/30 bg-brass/95 px-3 py-2 text-right text-emerald-950 shadow-[0_12px_30px_rgba(244,185,66,0.18)]">
              <p className="text-[0.68rem] font-semibold uppercase opacity-70">Punkte</p>
              <p className="text-base font-semibold tabular-nums">{viewedTotal}</p>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto px-1 pb-3 [scroll-padding-inline:1.25rem] [scroll-snap-type:x_mandatory] sm:px-0"
          onScroll={handlePlayerRowScroll}
          ref={playerRowRef}
        >
          <div className="flex gap-4 px-1 sm:px-0">
            {state.players.map((player) => {
              const scoreCard = getPlayerScoreCard(state, player.id);
              const active = player.id === state.currentPlayerId;
              const own = player.id === currentUserPlayer?.id;

              return (
                <motion.article
                  animate={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: active ? 1 : 0.78, scale: active ? 1 : 0.985, y: active ? -2 : 0 }
                  }
                  className={cn(
                    "relative w-[min(calc(100vw-2.75rem),28rem)] shrink-0 overflow-hidden rounded-lg border p-4 shadow-[0_16px_44px_rgba(0,0,0,0.22)] backdrop-blur-xl [scroll-snap-align:center]",
                    active
                      ? "border-brass/45 bg-[linear-gradient(145deg,rgba(244,185,66,0.16),rgba(255,255,255,0.09))]"
                      : "border-white/10 bg-white/[0.07]"
                  )}
                  key={player.id}
                  layout="position"
                  ref={(element) => {
                    playerCardRefs.current[player.id] = element;
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.01 }
                      : { damping: 28, stiffness: 360, type: "spring" }
                  }
                >
                  {active ? (
                    <motion.span
                      aria-hidden="true"
                      animate={
                        shouldReduceMotion
                          ? { opacity: 0.35 }
                          : { opacity: [0.22, 0.42, 0.22], scale: [0.96, 1.04, 0.96] }
                      }
                      className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brass/20 blur-2xl"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.01 }
                          : { duration: 2.8, ease: "easeInOut", repeat: Infinity }
                      }
                    />
                  ) : null}
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-white">
                        {player.displayName}
                      </h2>
                      <p className="mt-0.5 text-xs text-emerald-50/60">
                        Position {player.position}
                      </p>
                    </div>
                    <Badge variant={active ? "success" : own ? "accent" : "neutral"}>
                      {active ? "am Zug" : own ? "du" : `${scoreCard?.total ?? 0}`}
                    </Badge>
                  </div>
                  <ScoreCardBlock compact scoreCard={scoreCard} />
                </motion.article>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.08] p-3 shadow-[0_16px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Platzierung</h2>
            {viewedPlayer ? (
              <Badge variant="neutral" className="max-w-36 truncate">
                {viewedPlayer.displayName}
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            {state.ranking.map((entry) => {
              const viewed = entry.playerId === viewedPlayerId;
              const active = entry.isCurrentPlayer;

              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md border px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "border-brass/35 bg-brass/[0.12] font-semibold text-amber-50 shadow-sm"
                      : viewed
                        ? "border-emerald-300/20 bg-emerald-300/10 font-semibold text-emerald-50"
                        : "border-transparent text-emerald-50/60"
                  )}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                  key={entry.playerId}
                  layout="position"
                  transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.18 }}
                >
                  <span className="min-w-0 truncate">
                    {entry.rank}. {entry.displayName}
                  </span>
                  <span className="shrink-0 tabular-nums">{entry.total}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {userTurn && currentUserScoreCard ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-emerald-950/92 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_44px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-50/60">
                {filledCount}/{scoreCategories.length} Felder belegt
              </p>
              <p className="truncate text-sm font-semibold text-white">
                Kategorie eintragen
              </p>
            </div>
            <Button className="min-h-12 px-6" onClick={() => setEntryOpen(true)} type="button">
              <FilePenLine aria-hidden="true" className="h-4 w-4" />
              Eintragen
            </Button>
          </div>

        </div>
      ) : null}

      <AnimatePresence>
        {turnFeedback ? (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            aria-live="polite"
            className="pointer-events-none fixed inset-0 z-[95] grid place-items-center p-4"
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8, scale: 0.98 }}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: 0.98 }}
            key={turnFeedback.id}
            role="status"
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-brass/30 bg-[linear-gradient(145deg,rgba(6,78,59,0.96),rgba(2,23,19,0.96))] p-4 text-white shadow-2xl">
              <motion.span
                aria-hidden="true"
                animate={shouldReduceMotion ? { opacity: 0.18 } : { opacity: [0.12, 0.28, 0.12] }}
                className="absolute inset-x-8 top-0 h-px bg-brass"
                transition={
                  shouldReduceMotion ? { duration: 0.01 } : { duration: 1.2, repeat: Infinity }
                }
              />
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Score gespeichert</p>
                  <p className="mt-1 text-sm text-emerald-50/75">
                    {turnFeedback.nextIsCurrentUser
                      ? "Du bist wieder dran."
                      : `Weiter: ${turnFeedback.nextPlayerName}`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-emerald-50/70">
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1">
                      Runde {turnFeedback.roundNumber}
                    </span>
                    {turnFeedback.leaderName ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brass/20 bg-brass/[0.12] px-2 py-1 text-amber-100">
                        <Trophy aria-hidden="true" className="h-3.5 w-3.5" />
                        {turnFeedback.leaderName}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {entryOpen && currentUserScoreCard ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-[60] overflow-y-auto bg-emerald-950 text-white"
            exit={{ opacity: 0, y: 16 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div
              aria-hidden="true"
              className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(244,185,66,0.13),transparent_26rem),radial-gradient(circle_at_15%_18%,rgba(16,185,129,0.14),transparent_24rem),linear-gradient(180deg,#064e3b,#021713)]"
            />
            <div className="sticky top-0 z-[70] border-b border-white/10 bg-emerald-950/90 px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.26)] backdrop-blur-xl">
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-brass">
                    Eintragen
                  </p>
                  <h2 className="truncate text-lg font-semibold tracking-tight text-white">
                    Wuerfel und Kategorie
                  </h2>
                </div>
                <button
                  aria-label="Eintragen schliessen"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-emerald-50 shadow-sm transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.13]"
                  onClick={() => setEntryOpen(false)}
                  type="button"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mx-auto max-w-2xl px-4 py-5">
              <ScoreEntryForm
                action={enterScoreAction}
                onlineRollMode={rollMode === "online"}
                onSaved={() => {
                  showSavedFeedback();
                  setEntryOpen(false);
                  onSaved();
                }}
                scoreCard={currentUserScoreCard}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showRollModePicker ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                className="grid min-h-48 place-content-center gap-3 rounded-lg border border-white/10 bg-white/[0.08] p-5 text-center text-emerald-50 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.12]"
                onClick={() => {
                  setRollMode("real");
                  setShowRollModePicker(false);
                }}
                type="button"
              >
                <Dices className="mx-auto h-10 w-10 text-emerald-100" />
                <span className="text-lg font-semibold">Echte Wuerfel</span>
              </button>
              <button
                className="grid min-h-48 place-content-center gap-3 rounded-lg border border-brass/35 bg-[linear-gradient(145deg,rgba(244,185,66,0.18),rgba(16,185,129,0.12))] p-5 text-center text-white shadow-xl backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-brass/60 hover:bg-brass/15"
                onClick={() => {
                  setRollMode("online");
                  setShowRollModePicker(false);
                  setEntryOpen(true);
                }}
                type="button"
              >
                <Smartphone className="mx-auto h-10 w-10 text-brass" />
                <span className="text-lg font-semibold">Online Wuerfel</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

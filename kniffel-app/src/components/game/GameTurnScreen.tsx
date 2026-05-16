"use client";

import { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Dices, FilePenLine, Smartphone, X } from "lucide-react";

import { ScoreCardBlock } from "@/components/game/ScoreCardBlock";
import { ScoreEntryForm } from "@/components/game/ScoreEntryForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getFilledCategoryCount, getPlayerScoreCard, isUserTurn } from "@/game/game-state";
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
    };
  }, []);

  return (
    <section className="relative -mx-4 min-h-[100svh] bg-slate-50 px-4 pb-32 pt-3 sm:mx-0 sm:min-h-[calc(100svh-2rem)] sm:rounded-lg sm:border sm:border-slate-200/80 sm:bg-white/70 sm:p-5 sm:pb-32 sm:shadow-card sm:backdrop-blur-xl dark:bg-zinc-950 dark:sm:border-white/10 dark:sm:bg-zinc-900/70 dark:sm:shadow-card-dark">
      <div className="grid gap-4">
        <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200/70 bg-slate-50/95 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-lg sm:border sm:bg-white/80 dark:border-white/10 dark:bg-zinc-950/95 dark:sm:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <button
              aria-label="Zurueck zur Uebersicht"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-white/10 dark:text-zinc-50"
              onClick={onBackToLobby}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold tracking-tight text-ink dark:text-zinc-50">
                {state.name}
              </h1>
              <p className="mt-0.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Am Zug: {currentPlayer?.displayName ?? "offen"}
              </p>
            </div>
            <div className="shrink-0 rounded-lg bg-ink px-3 py-2 text-right text-white dark:bg-white dark:text-zinc-950">
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
                <article
                  className={cn(
                    "w-[min(calc(100vw-2.75rem),28rem)] shrink-0 rounded-lg border bg-white/85 p-4 shadow-sm [scroll-snap-align:center] dark:bg-white/5",
                    active
                      ? "border-emerald-500/35 dark:border-emerald-300/30"
                      : "border-slate-200 dark:border-white/10"
                  )}
                  key={player.id}
                  ref={(element) => {
                    playerCardRefs.current[player.id] = element;
                  }}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-ink dark:text-zinc-50">
                        {player.displayName}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                        Position {player.position}
                      </p>
                    </div>
                    <Badge variant={active ? "success" : own ? "accent" : "neutral"}>
                      {active ? "am Zug" : own ? "du" : `${scoreCard?.total ?? 0}`}
                    </Badge>
                  </div>
                  <ScoreCardBlock compact scoreCard={scoreCard} />
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink dark:text-zinc-50">Platzierung</h2>
            {viewedPlayer ? (
              <Badge variant="neutral" className="max-w-36 truncate">
                {viewedPlayer.displayName}
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            {state.ranking.map((entry) => {
              const viewed = entry.playerId === viewedPlayerId;

              return (
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm",
                    viewed
                      ? "bg-emerald-50 font-semibold text-emerald-950 dark:bg-emerald-300/10 dark:text-emerald-50"
                      : "text-slate-600 dark:text-zinc-400"
                  )}
                  key={entry.playerId}
                >
                  <span className="min-w-0 truncate">
                    {entry.rank}. {entry.displayName}
                  </span>
                  <span className="shrink-0 tabular-nums">{entry.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {userTurn && currentUserScoreCard ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_44px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-[0_-18px_44px_rgba(0,0,0,0.45)]">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {filledCount}/{scoreCategories.length} Felder belegt
              </p>
              <p className="truncate text-sm font-semibold text-ink dark:text-zinc-50">
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
        {entryOpen && currentUserScoreCard ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-[60] overflow-y-auto bg-slate-50 text-ink dark:bg-zinc-950 dark:text-zinc-50"
            exit={{ opacity: 0, y: 16 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="sticky top-0 z-[70] border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
                    Eintragen
                  </p>
                  <h2 className="truncate text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
                    Wuerfel und Kategorie
                  </h2>
                </div>
                <button
                  aria-label="Eintragen schliessen"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-white/10 dark:text-zinc-50"
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
            className="fixed inset-0 z-[90] grid place-items-center bg-black/45 p-4"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                className="grid min-h-48 place-content-center gap-3 rounded-lg border border-slate-200 bg-white p-5 text-center text-ink shadow-xl transition-all hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-white/20"
                onClick={() => {
                  setRollMode("real");
                  setShowRollModePicker(false);
                }}
                type="button"
              >
                <Dices className="mx-auto h-10 w-10 text-slate-700 dark:text-zinc-100" />
                <span className="text-lg font-semibold">Echte Wuerfel</span>
              </button>
              <button
                className="grid min-h-48 place-content-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-5 text-center text-emerald-950 shadow-xl transition-all hover:-translate-y-0.5 hover:border-emerald-400 dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-50 dark:hover:border-emerald-300/70"
                onClick={() => {
                  setRollMode("online");
                  setShowRollModePicker(false);
                  setEntryOpen(true);
                }}
                type="button"
              >
                <Smartphone className="mx-auto h-10 w-10 text-emerald-700 dark:text-emerald-200" />
                <span className="text-lg font-semibold">Online Wuerfel</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

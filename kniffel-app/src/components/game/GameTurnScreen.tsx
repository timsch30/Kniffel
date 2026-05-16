"use client";

import { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, FilePenLine, X } from "lucide-react";

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
  const playerCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const playerRowRef = useRef<HTMLDivElement | null>(null);
  const previousCurrentPlayerIdRef = useRef(state.currentPlayerId);
  const hasInitialAutoScrollRef = useRef(false);
  const currentPlayer = state.players.find((player) => player.id === state.currentPlayerId);
  const currentUserPlayer = state.players.find((player) => player.userId === currentUserId);
  const currentUserScoreCard = currentUserPlayer
    ? getPlayerScoreCard(state, currentUserPlayer.id)
    : null;
  const userTurn = isUserTurn(state, currentUserId);
  const filledCount = getFilledCategoryCount(currentUserScoreCard);
  const total = currentUserScoreCard?.total ?? 0;

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

      const styles = window.getComputedStyle(playerRow);
      const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
      const maxScrollLeft = Math.max(0, playerRow.scrollWidth - playerRow.clientWidth);
      const nextLeft = Math.min(Math.max(activeCard.offsetLeft - paddingLeft, 0), maxScrollLeft);

      playerRow.scrollTo({
        behavior: "smooth",
        left: nextLeft
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [state.currentPlayerId]);

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
              <p className="text-base font-semibold tabular-nums">{total}</p>
            </div>
          </div>
        </div>

        <div
          className="-mx-4 overflow-x-auto px-4 pb-3 [scroll-snap-type:x_mandatory] sm:mx-0 sm:px-0"
          ref={playerRowRef}
        >
          <div className="flex gap-4">
            {state.players.map((player) => {
              const scoreCard = getPlayerScoreCard(state, player.id);
              const active = player.id === state.currentPlayerId;
              const own = player.id === currentUserPlayer?.id;

              return (
                <article
                  className={cn(
                    "w-[min(86vw,28rem)] shrink-0 scroll-ml-4 rounded-lg border bg-white/85 p-4 shadow-sm [scroll-snap-align:start] dark:bg-white/5",
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
    </section>
  );
}

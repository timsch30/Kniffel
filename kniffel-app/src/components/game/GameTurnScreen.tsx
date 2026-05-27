"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Dices, FilePenLine, LockKeyhole, Smartphone, X } from "lucide-react";

import { Dice } from "@/components/game/Dice";
import { ScoreCardBlock } from "@/components/game/ScoreCardBlock";
import { ScoreEntryForm } from "@/components/game/ScoreEntryForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  canUserManageCurrentTurn,
  getFilledCategoryCount,
  getPlayerScoreCard
} from "@/game/game-state";
import { scoreCategories } from "@/game/scorecard";
import type { GameState } from "@/game/state";
import { cn } from "@/lib/cn";

type GameTurnScreenProps = {
  currentUserId: string;
  enterScoreAction: (formData: FormData) => void | Promise<void>;
  onBackToLobby: () => void;
  onSaved: () => void;
  suppressCurrentUserTurn?: boolean;
  state: GameState;
};

type AnimatedEntry = {
  category: GameState["lastEntries"][number]["category"];
  id: string;
  playerId: string;
};

type OnlineTurnUpdatePayload = {
  diceValues: number[];
  heldDice: boolean[];
  rollCount: number;
};

type BotReplayState = {
  diceValues: number[];
  heldDice: boolean[];
  playerName: string;
  rollCount: number;
};

function randomDiceValues() {
  return Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => a - b);
}

function LiveDiceWindow({
  activeTurn,
  className,
  playerName
}: {
  activeTurn: NonNullable<GameState["activeTurn"]>;
  className?: string;
  playerName: string;
}) {
  const diceSlots = Array.from({ length: 5 }, (_, index) => activeTurn.diceValues[index] ?? null);
  const rollLabel = Math.min(Math.max(activeTurn.rollCount, 0), 3);

  return (
    <section
      className={cn(
        "fixed inset-x-3 bottom-3 z-30 mx-auto max-w-sm overflow-hidden rounded-lg border border-brass/30 bg-[linear-gradient(145deg,rgba(6,78,59,0.94),rgba(2,23,19,0.96))] p-2.5 shadow-[0_18px_54px_rgba(0,0,0,0.34)] transition-[bottom] duration-200 sm:bottom-5 sm:backdrop-blur-xl",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent"
      />
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-brass">Live-Wurf</p>
          <h2 className="truncate text-sm font-semibold text-white">{playerName}</h2>
        </div>
        <Badge variant="accent">{rollLabel > 0 ? `Wurf ${rollLabel}/3` : "Bereit"}</Badge>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {diceSlots.map((value, index) => {
          const held = activeTurn.heldDice[index] ?? false;

          return (
            <div
              className={cn(
                "relative rounded-xl border p-0.5 transition-colors sm:p-1",
                held
                  ? "border-brass/75 bg-amber-200/10"
                  : "border-white/10 bg-white/[0.06]"
              )}
              key={index}
            >
              <Dice held={held} value={value} />
              {held ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-amber-100/30 bg-amber-300/90 text-amber-950 shadow-sm"
                >
                  <LockKeyhole className="h-3 w-3" />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LatestEntryWindow({
  latestEntry
}: {
  latestEntry: NonNullable<GameState["latestEntry"]>;
}) {
  const diceSlots = Array.from({ length: 5 }, (_, index) => latestEntry.diceValues[index] ?? null);

  return (
    <section className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-sm overflow-hidden rounded-lg border border-brass/30 bg-[linear-gradient(145deg,rgba(6,78,59,0.94),rgba(2,23,19,0.96))] p-2.5 shadow-[0_18px_54px_rgba(0,0,0,0.34)] sm:bottom-5 sm:backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-brass">Zuletzt eingetragen</p>
          <h2 className="truncate text-sm font-semibold text-white">{latestEntry.displayName}</h2>
        </div>
        <Badge variant="accent">{latestEntry.category}</Badge>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {diceSlots.map((value, index) => (
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-0.5 sm:p-1" key={index}>
            <Dice held={false} value={value} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function GameTurnScreen({
  currentUserId,
  enterScoreAction,
  onBackToLobby,
  onSaved,
  suppressCurrentUserTurn = false,
  state
}: GameTurnScreenProps) {
  const [entryOpen, setEntryOpen] = useState(false);
  const [rollMode, setRollMode] = useState<"real" | "online" | null>(null);
  const [showRollModePicker, setShowRollModePicker] = useState(false);
  const [botReplay, setBotReplay] = useState<BotReplayState | null>(null);
  const [animatingEntry, setAnimatingEntry] = useState<AnimatedEntry | null>(null);
  const [viewedPlayerId, setViewedPlayerId] = useState(
    () =>
      state.currentPlayerId ??
      state.players.find((player) => player.userId === currentUserId)?.id ??
      state.players[0]?.id ??
      ""
  );
  const playerIds = state.players.map((player) => player.id);
  const playerIdsKey = playerIds.join("|");
  const canLoopPlayers = state.players.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: canLoopPlayers,
    skipSnaps: false
  });
  const playersRef = useRef(state.players);
  const previousCurrentPlayerIdRef = useRef(state.currentPlayerId);
  const previousPlayerIdsKeyRef = useRef(playerIdsKey);
  const hasInitialAutoScrollRef = useRef(false);
  const latestEntryTimeoutRef = useRef<number | null>(null);
  const lastAnimatedEntryIdRef = useRef<string | null>(state.latestEntry?.id ?? null);
  const shouldReduceMotion = useReducedMotion();
  const currentPlayer = state.players.find((player) => player.id === state.currentPlayerId);
  const viewedPlayer = state.players.find((player) => player.id === viewedPlayerId);
  const viewedPlayerScoreCard = viewedPlayer ? getPlayerScoreCard(state, viewedPlayer.id) : null;
  const currentUserPlayer = state.players.find((player) => player.userId === currentUserId);
  const activeScoreCard = currentPlayer ? getPlayerScoreCard(state, currentPlayer.id) : null;
  const canManageTurn = !suppressCurrentUserTurn && canUserManageCurrentTurn(state, currentUserId);
  const shouldHideEntryForBotTurn = currentPlayer?.isBot === true;
  const canManageTurnEffective = canManageTurn && !botReplay && !shouldHideEntryForBotTurn;
  const filledCount = getFilledCategoryCount(activeScoreCard);
  const viewedTotal = viewedPlayerScoreCard?.total ?? 0;
  const lastEntryByPlayerId = new Map(state.lastEntries.map((entry) => [entry.playerId, entry]));

  const handleEmblaSelect = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    const selectedPlayer = playersRef.current[emblaApi.selectedScrollSnap()];

    if (selectedPlayer) {
      setViewedPlayerId(selectedPlayer.id);
    }
  }, [emblaApi]);

  const scrollToPlayer = useCallback(
    (playerId: string) => {
      if (!emblaApi) {
        return;
      }

      const playerIndex = playersRef.current.findIndex((player) => player.id === playerId);

      if (playerIndex === -1) {
        return;
      }

      setViewedPlayerId(playerId);
      emblaApi.scrollTo(playerIndex, shouldReduceMotion === true);
    },
    [emblaApi, shouldReduceMotion]
  );

  const updateOnlineTurn = useCallback(
    async (payload: OnlineTurnUpdatePayload) => {
      const response = await fetch(`/api/games/${state.gameId}/turn`, {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Live-Wurf konnte nicht gespeichert werden.");
      }
    },
    [state.gameId]
  );

  useEffect(() => {
    const latestEntry = state.latestEntry;

    if (!latestEntry || lastAnimatedEntryIdRef.current === latestEntry.id || !emblaApi) {
      return;
    }

    lastAnimatedEntryIdRef.current = latestEntry.id;

    if (latestEntryTimeoutRef.current !== null) {
      window.clearTimeout(latestEntryTimeoutRef.current);
    }

    setAnimatingEntry({
      category: latestEntry.category,
      id: latestEntry.id,
      playerId: latestEntry.playerId
    });
    scrollToPlayer(latestEntry.playerId);

    latestEntryTimeoutRef.current = window.setTimeout(
      () => {
        setAnimatingEntry((current) => (current?.id === latestEntry.id ? null : current));
        latestEntryTimeoutRef.current = null;

        if (state.currentPlayerId) {
          scrollToPlayer(state.currentPlayerId);
        }
      },
      shouldReduceMotion ? 350 : 2200
    );
  }, [emblaApi, scrollToPlayer, shouldReduceMotion, state.currentPlayerId, state.latestEntry]);

  useEffect(() => {
    playersRef.current = state.players;
  }, [state.players]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    handleEmblaSelect();
    emblaApi.on("select", handleEmblaSelect);
    emblaApi.on("reInit", handleEmblaSelect);

    return () => {
      emblaApi.off("select", handleEmblaSelect);
      emblaApi.off("reInit", handleEmblaSelect);
    };
  }, [emblaApi, handleEmblaSelect]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    emblaApi.reInit();
  }, [emblaApi, playerIdsKey]);

  useEffect(() => {
    if (!emblaApi || !state.currentPlayerId || latestEntryTimeoutRef.current !== null) {
      return;
    }

    const playerChanged = previousCurrentPlayerIdRef.current !== state.currentPlayerId;
    const playerOrderChanged = previousPlayerIdsKeyRef.current !== playerIdsKey;

    if (!playerChanged && !playerOrderChanged && hasInitialAutoScrollRef.current) {
      return;
    }

    previousCurrentPlayerIdRef.current = state.currentPlayerId;
    previousPlayerIdsKeyRef.current = playerIdsKey;
    hasInitialAutoScrollRef.current = true;

    scrollToPlayer(state.currentPlayerId);
  }, [emblaApi, playerIdsKey, scrollToPlayer, state.currentPlayerId]);

  useEffect(() => {
    const latestEntry = state.latestEntry;

    if (!latestEntry) {
      return;
    }

    const latestPlayer = state.players.find((player) => player.id === latestEntry.playerId);

    if (!latestPlayer?.isBot) {
      return;
    }

    let cancelled = false;
    const baseName = latestPlayer.displayName;

    setEntryOpen(false);
    setShowRollModePicker(false);
    setBotReplay({
      diceValues: randomDiceValues(),
      heldDice: [false, false, false, false, false],
      playerName: baseName,
      rollCount: 1
    });

    const firstTimeout = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setBotReplay({
        diceValues: randomDiceValues(),
        heldDice: [true, false, false, true, false],
        playerName: baseName,
        rollCount: 2
      });
    }, 1100);

    const secondTimeout = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setBotReplay({
        diceValues: latestEntry.diceValues.length === 5 ? latestEntry.diceValues : randomDiceValues(),
        heldDice: [true, true, true, true, true],
        playerName: baseName,
        rollCount: 3
      });
    }, 2200);

    const finalTimeout = window.setTimeout(() => {
      if (!cancelled) {
        setBotReplay(null);
      }
    }, 3400);

    return () => {
      cancelled = true;
      window.clearTimeout(firstTimeout);
      window.clearTimeout(secondTimeout);
      window.clearTimeout(finalTimeout);
    };
  }, [state.latestEntry, state.players]);

  useEffect(() => {
    if (suppressCurrentUserTurn) {
      setEntryOpen(false);
      setShowRollModePicker(false);
    }
  }, [suppressCurrentUserTurn]);

  useEffect(() => {
    if (canManageTurnEffective && !rollMode) {
      setShowRollModePicker(true);
    }
  }, [canManageTurnEffective, rollMode]);

  useEffect(() => {
    if (state.players.some((player) => player.id === viewedPlayerId)) {
      return;
    }

    setViewedPlayerId(state.currentPlayerId ?? state.players[0]?.id ?? "");
  }, [state.currentPlayerId, state.players, viewedPlayerId]);

  useEffect(() => {
    return () => {
      if (latestEntryTimeoutRef.current !== null) {
        window.clearTimeout(latestEntryTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section
      className={cn(
        "relative -mx-4 min-h-[100svh] overflow-hidden px-4 pt-0 text-white sm:mx-0 sm:min-h-[calc(100svh-2rem)] sm:rounded-lg sm:border sm:border-white/10 sm:bg-white/[0.06] sm:px-5 sm:pt-0 sm:shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:backdrop-blur-xl",
        state.activeTurn ? "pb-48 sm:pb-48" : "pb-32 sm:pb-32"
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(244,185,66,0.14),transparent_28rem),radial-gradient(circle_at_15%_18%,rgba(16,185,129,0.15),transparent_24rem)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(white_1px,transparent_1px)] [background-size:32px_32px]"
      />
      <div className="grid gap-4">
        <div className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-emerald-950/90 px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.2)] sm:static sm:mx-0 sm:rounded-lg sm:border sm:bg-white/[0.08] sm:backdrop-blur-xl">
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

        <div className="-mx-4 overflow-hidden px-4 pb-3 sm:mx-0 sm:px-0" ref={emblaRef}>
          <div className="flex touch-pan-y gap-4">
            {state.players.map((player) => {
              const scoreCard = getPlayerScoreCard(state, player.id);
              const active = player.id === state.currentPlayerId;
              const viewed = player.id === viewedPlayerId;
              const own = player.id === currentUserPlayer?.id;
              const lastEntry = lastEntryByPlayerId.get(player.id);

              return (
                <div
                  className="min-w-0 shrink-0 grow-0"
                  key={player.id}
                  style={{ flexBasis: "min(calc(100vw - 2rem), 28rem)" }}
                >
                  <motion.article
                    animate={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : {
                            opacity: viewed ? 1 : 0.52,
                            scale: viewed ? 1 : 0.93,
                            y: viewed ? (active ? -4 : -2) : 12
                          }
                    }
                    className={cn(
                      "relative h-full overflow-hidden rounded-lg border p-4 shadow-[0_16px_44px_rgba(0,0,0,0.22)] backdrop-blur-xl will-change-transform",
                      active
                        ? "border-brass/45 bg-[linear-gradient(145deg,rgba(244,185,66,0.16),rgba(255,255,255,0.09))]"
                        : viewed
                          ? "border-emerald-300/25 bg-white/[0.1]"
                          : "border-white/10 bg-white/[0.06]"
                    )}
                    initial={false}
                    layout="position"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.01 }
                        : { damping: 24, mass: 0.9, stiffness: 260, type: "spring" }
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
                            : { duration: 2.8, ease: "easeInOut", repeat: 2 }
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
                    <ScoreCardBlock
                      animateEntryCategory={
                        animatingEntry?.playerId === player.id ? animatingEntry.category : null
                      }
                      compact
                      lastEntryCategory={lastEntry?.category ?? null}
                      scoreCard={scoreCard}
                    />
                  </motion.article>
                </div>
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

      {canManageTurnEffective && activeScoreCard ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-emerald-950/92 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_44px_rgba(0,0,0,0.4)] sm:backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-50/60">
                {filledCount}/{scoreCategories.length} Felder belegt
              </p>
              <p className="truncate text-sm font-semibold text-white">
                Fuer {currentPlayer?.displayName ?? "Spieler"} eintragen
              </p>
            </div>
            <Button className="min-h-12 px-6" onClick={() => setEntryOpen(true)} type="button">
              <FilePenLine aria-hidden="true" className="h-4 w-4" />
              Eintragen
            </Button>
          </div>

        </div>
      ) : null}

      {state.activeTurn ? (
        <LiveDiceWindow
          activeTurn={state.activeTurn}
          className={canManageTurnEffective && !entryOpen ? "bottom-24 sm:bottom-24" : undefined}
          playerName={
            state.players.find((player) => player.id === state.activeTurn?.playerId)
              ?.displayName ?? "Aktueller Spieler"
          }
        />
      ) : null}

      {!state.activeTurn && botReplay ? (
        <LiveDiceWindow
          activeTurn={{
            diceValues: botReplay.diceValues,
            heldDice: botReplay.heldDice,
            id: "bot-replay",
            playerId: "bot-replay",
            rollCount: botReplay.rollCount,
            updatedAt: new Date().toISOString()
          }}
          playerName={botReplay.playerName}
        />
      ) : null}

      {!state.activeTurn && state.latestEntry && (suppressCurrentUserTurn || !canManageTurn) ? (
        <LatestEntryWindow latestEntry={state.latestEntry} />
      ) : null}

      <AnimatePresence>
        {entryOpen && canManageTurnEffective && activeScoreCard ? (
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
            <div className="sticky top-0 z-[70] border-b border-white/10 bg-emerald-950/90 px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.26)] sm:backdrop-blur-xl">
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-brass">
                    Eintragen
                  </p>
                  <h2 className="truncate text-lg font-semibold tracking-tight text-white">
                    {currentPlayer?.displayName ?? "Wuerfel und Kategorie"}
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
                onOnlineTurnUpdate={rollMode === "online" ? updateOnlineTurn : undefined}
                onSaved={() => {
                  setEntryOpen(false);
                  onSaved();
                }}
                scoreCard={activeScoreCard}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showRollModePicker && canManageTurnEffective ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4 sm:backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                className="grid min-h-48 place-content-center gap-3 rounded-lg border border-white/10 bg-white/[0.08] p-5 text-center text-emerald-50 shadow-xl transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.12] sm:backdrop-blur-xl"
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
                className="grid min-h-48 place-content-center gap-3 rounded-lg border border-brass/35 bg-[linear-gradient(145deg,rgba(244,185,66,0.18),rgba(16,185,129,0.12))] p-5 text-center text-white shadow-xl transition-all hover:-translate-y-0.5 hover:border-brass/60 hover:bg-brass/15 sm:backdrop-blur-xl"
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

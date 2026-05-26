"use client";

import { useCallback, useRef, useState } from "react";

import { WifiOff } from "lucide-react";

import { GameLobby } from "@/components/game/GameLobby";
import { GameTurnScreen } from "@/components/game/GameTurnScreen";
import { useVisiblePolling } from "@/components/hooks/useVisiblePolling";
import { Alert } from "@/components/ui/Alert";
import { canUserManageCurrentTurn, getPlayerByUserId } from "@/game/game-state";
import type { GameState } from "@/game/state";

const TURN_REVEAL_DELAY_MS = 1500;
const SAVE_REFRESH_RETRY_DELAY_MS = 250;
const ACTIVE_TURN_POLL_INTERVAL_MS = 700;
const ACTIVE_GAME_POLL_INTERVAL_MS = 3000;
const IDLE_GAME_POLL_INTERVAL_MS = 5000;

type GameViewProps = {
  addBotPlayerAction: () => void | Promise<void>;
  addGuestPlayerAction: () => void | Promise<void>;
  currentUserId: string;
  enterScoreAction: (formData: FormData) => void | Promise<void>;
  error?: string;
  initialState: GameState;
  inviteFriendToGameAction: (formData: FormData) => void | Promise<void>;
  inviteLink: string;
  isDebugAdmin?: boolean;
  reorderPlayersAction: (formData: FormData) => void | Promise<void>;
  removeGuestPlayerAction: (playerId: string) => void | Promise<void>;
  restartGameAction: () => void | Promise<void>;
  simulateGameAction?: () => void | Promise<void>;
  startGameAction: (formData: FormData) => void | Promise<void>;
};

type ApplyStateOptions = {
  allowAutoOpenTurn?: boolean;
  updateAbilityTracking?: boolean;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function GameView({
  addBotPlayerAction,
  addGuestPlayerAction,
  currentUserId,
  enterScoreAction,
  error,
  initialState,
  inviteFriendToGameAction,
  inviteLink,
  isDebugAdmin = false,
  reorderPlayersAction,
  removeGuestPlayerAction,
  restartGameAction,
  simulateGameAction,
  startGameAction
}: GameViewProps) {
  const [state, setState] = useState(initialState);
  const [pollError, setPollError] = useState<string | null>(null);
  const [turnModeOpen, setTurnModeOpen] = useState(() => initialState.status === "ACTIVE");
  const [turnRevealPending, setTurnRevealPending] = useState(false);
  const fetchingRef = useRef(false);
  const pendingTurnRevealRef = useRef(false);
  const stateRef = useRef(initialState);
  const wasCurrentUserAbleToAct = useRef(canUserManageCurrentTurn(initialState, currentUserId));
  const currentUserPlayer = getPlayerByUserId(state, currentUserId);
  const hasActiveTurn = Boolean(state.activeTurn);
  const pollingIntervalMs = hasActiveTurn
    ? ACTIVE_TURN_POLL_INTERVAL_MS
    : state.status === "ACTIVE"
      ? ACTIVE_GAME_POLL_INTERVAL_MS
      : IDLE_GAME_POLL_INTERVAL_MS;

  const fetchGameState = useCallback(async (since?: string) => {
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    const response = await fetch(`/api/games/${initialState.gameId}/state${query}`, {
      cache: "no-store"
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Aktualisierung fehlgeschlagen.");
    }

    return (await response.json()) as GameState;
  }, [initialState.gameId]);

  const applyState = useCallback(
    (
      nextState: GameState,
      {
        allowAutoOpenTurn = true,
        updateAbilityTracking = true
      }: ApplyStateOptions = {}
    ) => {
      const currentState = stateRef.current;
      const nextCanCurrentUserAct = canUserManageCurrentTurn(nextState, currentUserId);

      if (nextState.updatedAt === currentState.updatedAt) {
        setPollError(null);

        if (updateAbilityTracking) {
          wasCurrentUserAbleToAct.current = nextCanCurrentUserAct;
        }

        return nextState;
      }

      stateRef.current = nextState;
      setState(nextState);
      setPollError(null);

      if (nextState.status === "ACTIVE" && currentState.status !== "ACTIVE") {
        setTurnModeOpen(true);
      }

      if (allowAutoOpenTurn && !wasCurrentUserAbleToAct.current && nextCanCurrentUserAct) {
        setTurnModeOpen(true);
      }

      if (updateAbilityTracking) {
        wasCurrentUserAbleToAct.current = nextCanCurrentUserAct;
      }

      return nextState;
    },
    [currentUserId]
  );

  const refreshState = useCallback(async () => {
    const currentState = stateRef.current;
    const playerIdBeforeRefresh = currentState.currentPlayerId;
    const latestEntryIdBeforeRefresh = currentState.latestEntry?.id ?? null;
    const canActBeforeRefresh = canUserManageCurrentTurn(currentState, currentUserId);
    const nextState = await fetchGameState(currentState.updatedAt);

    if (!nextState) {
      setPollError(null);
      return currentState;
    }

    const allowTurnReveal = !pendingTurnRevealRef.current;
    const nextCanCurrentUserAct = canUserManageCurrentTurn(nextState, currentUserId);
    const hasNewLatestEntry =
      Boolean(nextState.latestEntry) &&
      nextState.latestEntry?.id !== latestEntryIdBeforeRefresh;
    const shouldDelayOwnTurnReveal =
      allowTurnReveal &&
      hasNewLatestEntry &&
      nextState.currentPlayerId !== playerIdBeforeRefresh &&
      nextCanCurrentUserAct;

    if (shouldDelayOwnTurnReveal) {
      pendingTurnRevealRef.current = true;
      setTurnRevealPending(true);

      applyState(nextState, {
        allowAutoOpenTurn: false,
        updateAbilityTracking: false
      });

      await wait(TURN_REVEAL_DELAY_MS);

      pendingTurnRevealRef.current = false;
      setTurnRevealPending(false);

      if (nextState.status === "ACTIVE" && !canActBeforeRefresh) {
        setTurnModeOpen(true);
      }

      wasCurrentUserAbleToAct.current = nextCanCurrentUserAct;
      return nextState;
    }

    applyState(nextState, {
      allowAutoOpenTurn: allowTurnReveal,
      updateAbilityTracking: allowTurnReveal
    });

    return nextState;
  }, [applyState, currentUserId, fetchGameState]);

  const pollGameState = useCallback(async () => {
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;

    try {
      await refreshState();
    } catch {
      setPollError("Live-Aktualisierung pausiert.");
    } finally {
      fetchingRef.current = false;
    }
  }, [refreshState]);

  useVisiblePolling(pollGameState, {
    intervalMs: pollingIntervalMs
  });

  return (
    <>
      <div className="grid gap-3">
        {pollError ? (
          <Alert variant="info">
            <span className="inline-flex items-center gap-2">
              <WifiOff aria-hidden="true" className="h-4 w-4" />
              {pollError}
            </span>
          </Alert>
        ) : null}

        {error ? <Alert variant="danger">{error}</Alert> : null}

        {!currentUserPlayer ? <Alert variant="danger">Nicht in dieser Runde.</Alert> : null}
      </div>

      {state.status === "ACTIVE" && turnModeOpen && currentUserPlayer ? (
        <GameTurnScreen
          currentUserId={currentUserId}
          enterScoreAction={enterScoreAction}
          onBackToLobby={() => setTurnModeOpen(false)}
          onSaved={() => {
            const currentState = stateRef.current;
            const playerIdBeforeSave = currentState.currentPlayerId;
            const latestEntryIdBeforeSave = currentState.latestEntry?.id ?? null;
            const canActBeforeSave = canUserManageCurrentTurn(currentState, currentUserId);

            void (async () => {
              for (let attempt = 0; attempt < 6; attempt += 1) {
                try {
                  const nextState = await fetchGameState();

                  if (nextState && nextState.currentPlayerId !== playerIdBeforeSave) {
                    const nextCanCurrentUserAct = canUserManageCurrentTurn(nextState, currentUserId);
                    const hasNewLatestEntry =
                      Boolean(nextState.latestEntry) &&
                      nextState.latestEntry?.id !== latestEntryIdBeforeSave;

                    if (hasNewLatestEntry) {
                      pendingTurnRevealRef.current = true;
                      setTurnRevealPending(true);
                    }

                    applyState(nextState, {
                      allowAutoOpenTurn: false,
                      updateAbilityTracking: false
                    });

                    if (hasNewLatestEntry) {
                      await wait(TURN_REVEAL_DELAY_MS);
                    }

                    pendingTurnRevealRef.current = false;
                    setTurnRevealPending(false);

                    if (
                      nextState.status === "ACTIVE" &&
                      !canActBeforeSave &&
                      nextCanCurrentUserAct
                    ) {
                      setTurnModeOpen(true);
                    }

                    wasCurrentUserAbleToAct.current = nextCanCurrentUserAct;
                    return;
                  }
                } catch {
                  // ignore retry errors here; polling continues in background
                }

                await wait(SAVE_REFRESH_RETRY_DELAY_MS);
              }
            })();
          }}
          state={state}
          suppressCurrentUserTurn={turnRevealPending}
        />
      ) : (
        <GameLobby
          addBotPlayerAction={addBotPlayerAction}
          addGuestPlayerAction={addGuestPlayerAction}
          currentUserId={currentUserId}
          inviteLink={inviteLink}
          inviteFriendToGameAction={inviteFriendToGameAction}
          onOpenTurn={() => setTurnModeOpen(true)}
          reorderPlayersAction={reorderPlayersAction}
          removeGuestPlayerAction={removeGuestPlayerAction}
          restartGameAction={restartGameAction}
          showDebugSimulation={isDebugAdmin && Boolean(simulateGameAction)}
          simulateGameAction={simulateGameAction}
          startGameAction={startGameAction}
          state={state}
        />
      )}
    </>
  );
}

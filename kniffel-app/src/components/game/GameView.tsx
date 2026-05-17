"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { WifiOff } from "lucide-react";

import { GameLobby } from "@/components/game/GameLobby";
import { GameTurnScreen } from "@/components/game/GameTurnScreen";
import { Alert } from "@/components/ui/Alert";
import { canUserManageCurrentTurn, getPlayerByUserId } from "@/game/game-state";
import type { GameState } from "@/game/state";

type GameViewProps = {
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

export function GameView({
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
  function getNextPlayerId(nextFromState: GameState): string | null {
    if (!nextFromState.currentPlayerId) {
      return null;
    }

    const playerIdsInOrder = [...nextFromState.players]
      .sort((a, b) => a.position - b.position)
      .map((player) => player.id);
    const currentIndex = playerIdsInOrder.indexOf(nextFromState.currentPlayerId);

    if (currentIndex === -1 || playerIdsInOrder.length === 0) {
      return nextFromState.currentPlayerId;
    }

    return playerIdsInOrder[(currentIndex + 1) % playerIdsInOrder.length];
  }

  const [state, setState] = useState(initialState);
  const [pollError, setPollError] = useState<string | null>(null);
  const [turnModeOpen, setTurnModeOpen] = useState(() => initialState.status === "ACTIVE");
  const fetchingRef = useRef(false);
  const wasCurrentUserAbleToAct = useRef(canUserManageCurrentTurn(initialState, currentUserId));
  const currentUserPlayer = getPlayerByUserId(state, currentUserId);

  const refreshState = useCallback(async () => {
    const response = await fetch(`/api/games/${initialState.gameId}/state`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Aktualisierung fehlgeschlagen.");
    }

    const nextState = (await response.json()) as GameState;
    const nextCanCurrentUserAct = canUserManageCurrentTurn(nextState, currentUserId);

    setState(nextState);
    setPollError(null);

    if (nextState.status === "ACTIVE" && state.status !== "ACTIVE") {
      setTurnModeOpen(true);
    }

    if (!wasCurrentUserAbleToAct.current && nextCanCurrentUserAct) {
      setTurnModeOpen(true);
    }

    wasCurrentUserAbleToAct.current = nextCanCurrentUserAct;
    return nextState;
  }, [currentUserId, initialState.gameId, state.status]);

  useEffect(() => {
    let active = true;

    async function fetchState() {
      if (fetchingRef.current) {
        return;
      }

      fetchingRef.current = true;

      try {
        await refreshState();

        if (!active) {
          return;
        }
      } catch {
        if (active) {
          setPollError("Live-Aktualisierung pausiert.");
        }
      } finally {
        fetchingRef.current = false;
      }
    }

    const intervalId = window.setInterval(fetchState, 2500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [refreshState]);

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
            const playerIdBeforeSave = state.currentPlayerId;

            setState((previousState) => ({
              ...previousState,
              currentPlayerId: getNextPlayerId(previousState)
            }));

            void (async () => {
              for (let attempt = 0; attempt < 6; attempt += 1) {
                try {
                  const response = await fetch(`/api/games/${initialState.gameId}/state`, {
                    cache: "no-store"
                  });

                  if (!response.ok) {
                    throw new Error("Aktualisierung fehlgeschlagen.");
                  }

                  const nextState = (await response.json()) as GameState;

                  if (nextState.currentPlayerId !== playerIdBeforeSave) {
                    const nextCanCurrentUserAct = canUserManageCurrentTurn(nextState, currentUserId);
                    setState(nextState);
                    setPollError(null);

                    if (nextState.status === "ACTIVE" && state.status !== "ACTIVE") {
                      setTurnModeOpen(true);
                    }

                    if (!wasCurrentUserAbleToAct.current && nextCanCurrentUserAct) {
                      setTurnModeOpen(true);
                    }

                    wasCurrentUserAbleToAct.current = nextCanCurrentUserAct;
                    return;
                  }
                } catch {
                  // ignore retry errors here; polling continues in background
                }

                await new Promise((resolve) => {
                  window.setTimeout(resolve, 250);
                });
              }
            })();
          }}
          state={state}
        />
      ) : (
        <GameLobby
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

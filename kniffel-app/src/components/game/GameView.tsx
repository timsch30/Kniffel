"use client";

import { useEffect, useRef, useState } from "react";

import { WifiOff } from "lucide-react";

import { GameLobby } from "@/components/game/GameLobby";
import { GameTurnScreen } from "@/components/game/GameTurnScreen";
import { Alert } from "@/components/ui/Alert";
import {
  getCurrentUserScoreCard,
  getPlayerByUserId,
  isUserTurn
} from "@/game/game-state";
import type { GameState } from "@/game/state";

type GameViewProps = {
  currentUserId: string;
  enterScoreAction: (formData: FormData) => void | Promise<void>;
  error?: string;
  initialState: GameState;
  inviteLink: string;
  startGameAction: () => void | Promise<void>;
};

export function GameView({
  currentUserId,
  enterScoreAction,
  error,
  initialState,
  inviteLink,
  startGameAction
}: GameViewProps) {
  const [state, setState] = useState(initialState);
  const [pollError, setPollError] = useState<string | null>(null);
  const [turnModeOpen, setTurnModeOpen] = useState(() =>
    isUserTurn(initialState, currentUserId)
  );
  const fetchingRef = useRef(false);
  const wasCurrentUserTurn = useRef(isUserTurn(initialState, currentUserId));
  const currentUserPlayer = getPlayerByUserId(state, currentUserId);
  const currentUserScoreCard = getCurrentUserScoreCard(state, currentUserId);
  const currentUserTurn = isUserTurn(state, currentUserId);

  useEffect(() => {
    let active = true;

    async function fetchState() {
      if (fetchingRef.current) {
        return;
      }

      fetchingRef.current = true;

      try {
        const response = await fetch(`/api/games/${initialState.gameId}/state`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Aktualisierung fehlgeschlagen.");
        }

        const nextState = (await response.json()) as GameState;
        const nextIsCurrentUserTurn = isUserTurn(nextState, currentUserId);

        if (!active) {
          return;
        }

        setState(nextState);
        setPollError(null);

        if (!wasCurrentUserTurn.current && nextIsCurrentUserTurn) {
          setTurnModeOpen(true);
        }

        if (wasCurrentUserTurn.current && !nextIsCurrentUserTurn) {
          setTurnModeOpen(false);
        }

        wasCurrentUserTurn.current = nextIsCurrentUserTurn;
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
  }, [currentUserId, initialState.gameId]);

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

      {currentUserTurn && turnModeOpen && currentUserPlayer && currentUserScoreCard ? (
        <GameTurnScreen
          currentUserPlayer={currentUserPlayer}
          enterScoreAction={enterScoreAction}
          onBackToLobby={() => setTurnModeOpen(false)}
          onSaved={() => setTurnModeOpen(false)}
          scoreCard={currentUserScoreCard}
        />
      ) : (
        <GameLobby
          currentUserId={currentUserId}
          inviteLink={inviteLink}
          onOpenTurn={() => setTurnModeOpen(true)}
          startGameAction={startGameAction}
          state={state}
        />
      )}
    </>
  );
}

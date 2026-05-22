import type { GameState } from "@/game/state";

export function isCurrentUserWinner(state: GameState, currentUserId: string): boolean {
  const player = state.players.find((entry) => entry.userId === currentUserId) ?? null;

  return Boolean(
    state.status === "FINISHED" &&
      state.winner &&
      player &&
      state.winner.playerId === player.id
  );
}

export function getVictoryCelebrationStorageKey(
  state: GameState,
  currentUserId: string
): string | null {
  if (!state.winner || !isCurrentUserWinner(state, currentUserId)) {
    return null;
  }

  return [
    "kniffel",
    "victory-celebration",
    state.gameId,
    state.roundNumber,
    state.winner.playerId,
    currentUserId
  ].join(":");
}

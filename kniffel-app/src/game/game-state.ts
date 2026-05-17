import { scoreCategories, upperScoreCategories } from "@/game/scorecard";
import type { GameState, GameStatePlayer, GameStateRankingEntry, GameStateScoreCard } from "@/game/state";
import type { ScoreCategory } from "@/game/types";

export function getCurrentPlayer(state: GameState): GameStatePlayer | null {
  return state.players.find((player) => player.id === state.currentPlayerId) ?? null;
}

export function getPlayerByUserId(
  state: GameState,
  userId: string
): GameStatePlayer | null {
  return state.players.find((player) => player.userId === userId) ?? null;
}

export function getPlayerScoreCard(
  state: GameState,
  playerId: string
): GameStateScoreCard | null {
  return state.scoreCards.find((scoreCard) => scoreCard.playerId === playerId) ?? null;
}

export function getCurrentUserScoreCard(
  state: GameState,
  currentUserId: string
): GameStateScoreCard | null {
  const player = getPlayerByUserId(state, currentUserId);

  return player ? getPlayerScoreCard(state, player.id) : null;
}

export function isUserTurn(state: GameState, currentUserId: string): boolean {
  const player = getPlayerByUserId(state, currentUserId);

  return Boolean(state.status === "ACTIVE" && player && state.currentPlayerId === player.id);
}

export function canUserManageCurrentTurn(state: GameState, currentUserId: string): boolean {
  const currentPlayer = getCurrentPlayer(state);

  return Boolean(
    state.status === "ACTIVE" &&
      currentPlayer &&
      (currentPlayer.userId === currentUserId || state.ownerId === currentUserId)
  );
}

export function getNextPlayer(state: GameState): GameStatePlayer | null {
  if (!state.currentPlayerId || state.players.length === 0) {
    return null;
  }

  const orderedPlayers = [...state.players].sort((left, right) => left.position - right.position);
  const currentIndex = orderedPlayers.findIndex((player) => player.id === state.currentPlayerId);

  if (currentIndex === -1) {
    return null;
  }

  return orderedPlayers[(currentIndex + 1) % orderedPlayers.length] ?? null;
}

export function getLeader(state: GameState): GameStateRankingEntry | null {
  return state.ranking[0] ?? null;
}

export function getUpperSectionScore(scoreCard: GameStateScoreCard | null | undefined): number {
  if (!scoreCard) {
    return 0;
  }

  return upperScoreCategories.reduce((sum, category) => sum + (scoreCard[category] ?? 0), 0);
}

export function getLowerSectionScore(scoreCard: GameStateScoreCard | null | undefined): number {
  if (!scoreCard) {
    return 0;
  }

  const upperCategories = new Set<ScoreCategory>(upperScoreCategories);

  return scoreCategories.reduce((sum, category) => {
    if (upperCategories.has(category)) {
      return sum;
    }

    return sum + (scoreCard[category] ?? 0);
  }, 0);
}

export function getFilledCategoryCount(scoreCard: GameStateScoreCard | null | undefined): number {
  if (!scoreCard) {
    return 0;
  }

  return scoreCategories.filter(
    (category) => scoreCard[category] !== null && scoreCard[category] !== undefined
  ).length;
}

export function getOpenCategoryCount(scoreCard: GameStateScoreCard | null | undefined): number {
  return scoreCategories.length - getFilledCategoryCount(scoreCard);
}

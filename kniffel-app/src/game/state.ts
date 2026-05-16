import type { ScoreCard, ScoreCategory } from "@/game/types";

export type GameStatePlayer = {
  displayName: string;
  id: string;
  position: number;
  userId: string | null;
};

export type GameStateScoreCard = Omit<ScoreCard, "struckCategories"> & {
  id: string;
  playerId: string;
  struckCategories: ScoreCategory[];
  total: number | null;
  upperBonus: number | null;
};

export type GameStateRankingEntry = {
  displayName: string;
  isCurrentPlayer: boolean;
  playerId: string;
  position: number;
  rank: number;
  total: number;
};

export type GameStateWinner = {
  displayName: string;
  playerId: string;
  total: number;
} | null;

export type GameStateLastAction = {
  createdAt: string;
  diceValues: number[];
  displayName: string;
} | null;

export type GameInviteFriend = {
  id: string;
  invitationId: string | null;
  status: "ACCEPTED" | "IN_GAME" | "PENDING" | null;
  username: string;
};

export type GameState = {
  currentPlayerId: string | null;
  currentPlayerName: string | null;
  friendInvites: GameInviteFriend[];
  gameId: string;
  inviteCode: string;
  lastAction: GameStateLastAction;
  name: string;
  ownerId: string;
  players: GameStatePlayer[];
  ranking: GameStateRankingEntry[];
  roundNumber: number;
  scoreCards: GameStateScoreCard[];
  status: string;
  winner: GameStateWinner;
};

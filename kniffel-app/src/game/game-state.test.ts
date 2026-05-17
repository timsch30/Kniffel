import { strictEqual } from "assert";
import { describe, it } from "node:test";

import {
  getVictoryCelebrationStorageKey,
  isCurrentUserWinner
} from "./victory-celebration.ts";
import type { GameState } from "@/game/state";

const finishedState: GameState = {
  currentPlayerId: null,
  currentPlayerName: null,
  friendInvites: [],
  gameId: "game-1",
  inviteCode: "ABC123",
  lastAction: null,
  name: "Finale",
  ownerId: "user-1",
  players: [
    { displayName: "Ada", id: "player-1", position: 1, userId: "user-1" },
    { displayName: "Ben", id: "player-2", position: 2, userId: "user-2" }
  ],
  ranking: [
    { displayName: "Ada", isCurrentPlayer: false, playerId: "player-1", position: 1, rank: 1, total: 250 },
    { displayName: "Ben", isCurrentPlayer: false, playerId: "player-2", position: 2, rank: 2, total: 200 }
  ],
  roundNumber: 3,
  scoreCards: [],
  status: "FINISHED",
  winner: { displayName: "Ada", playerId: "player-1", total: 250 }
};

describe("winner celebration helpers", () => {
  it("detects the logged-in winner", () => {
    strictEqual(isCurrentUserWinner(finishedState, "user-1"), true);
    strictEqual(isCurrentUserWinner(finishedState, "user-2"), false);
  });

  it("only creates a celebration key for the winner", () => {
    strictEqual(
      getVictoryCelebrationStorageKey(finishedState, "user-1"),
      "kniffel:victory-celebration:game-1:3:player-1:user-1"
    );
    strictEqual(getVictoryCelebrationStorageKey(finishedState, "user-2"), null);
  });

  it("does not trigger before a game is finished", () => {
    const activeState = { ...finishedState, status: "ACTIVE" };

    strictEqual(isCurrentUserWinner(activeState, "user-1"), false);
    strictEqual(getVictoryCelebrationStorageKey(activeState, "user-1"), null);
  });
});

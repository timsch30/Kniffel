import { strictEqual } from "assert";
import { describe, it } from "node:test";

import {
  areAllScoreCardsComplete,
  calculateTotalScore,
  calculateUpperBonus,
  determineNextPlayer,
  isCategoryFilled,
  isScoreCardComplete,
  scoreCategories
} from "@/game/scorecard";
import type { ScoreCard } from "@/game/types";

describe("scorecard helpers", () => {
  it("calculates upper bonus", () => {
    strictEqual(
      calculateUpperBonus({ fives: 25, fours: 20, ones: 3, sixes: 12, threes: 3, twos: 2 }),
      35
    );
    strictEqual(calculateUpperBonus({ fives: 20, fours: 12, ones: 3, sixes: 12 }), 0);
  });

  it("calculates total score", () => {
    strictEqual(
      calculateTotalScore({
        chance: 20,
        fives: 25,
        fours: 20,
        ones: 3,
        sixes: 12,
        threes: 3,
        twos: 2
      }),
      120
    );
  });

  it("detects filled categories", () => {
    strictEqual(isCategoryFilled({ chance: 0 }, "chance"), true);
    strictEqual(isCategoryFilled({}, "chance"), false);
  });

  it("detects complete scorecards", () => {
    const completeScoreCard = Object.fromEntries(
      scoreCategories.map((category) => [category, 0])
    ) as ScoreCard;

    strictEqual(isScoreCardComplete(completeScoreCard), true);
    strictEqual(isScoreCardComplete({ ...completeScoreCard, chance: null }), false);
  });

  it("determines the next player", () => {
    const players = [
      { id: "b", position: 2 },
      { id: "a", position: 1 }
    ];

    strictEqual(determineNextPlayer(players, "a").nextPlayerId, "b");
    strictEqual(determineNextPlayer(players, "b").completedRotation, true);
  });

  it("detects finished games", () => {
    const completeScoreCard = Object.fromEntries(
      scoreCategories.map((category) => [category, 1])
    ) as ScoreCard;

    strictEqual(areAllScoreCardsComplete([completeScoreCard, completeScoreCard]), true);
    strictEqual(areAllScoreCardsComplete([completeScoreCard, { chance: 1 }]), false);
  });
});

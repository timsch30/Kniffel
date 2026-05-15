import { deepStrictEqual, strictEqual, throws } from "assert";
import { describe, it } from "node:test";

import {
  calculateCategoryPriority,
  calculateAllCategoryScores,
  calculateScoreForCategory,
  getAvailableScoreSuggestions,
  getRecommendedCategory
} from "@/game/scoring";

const exampleDiceValues = [6, 6, 3, 3, 3];

describe("scoring helpers", () => {
  it("calculates all category scores for physical dice values", () => {
    deepStrictEqual(calculateAllCategoryScores(exampleDiceValues), {
      chance: 21,
      fives: 0,
      fourOfAKind: 0,
      fours: 0,
      fullHouse: 25,
      kniffel: 0,
      largeStraight: 0,
      ones: 0,
      sixes: 12,
      smallStraight: 0,
      threeOfAKind: 21,
      threes: 9,
      twos: 0
    });
  });

  it("calculates selected categories", () => {
    strictEqual(calculateScoreForCategory("fullHouse", exampleDiceValues), 25);
    strictEqual(calculateScoreForCategory("threeOfAKind", exampleDiceValues), 21);
    strictEqual(calculateScoreForCategory("sixes", exampleDiceValues), 12);
    strictEqual(calculateScoreForCategory("threes", exampleDiceValues), 9);
    strictEqual(calculateScoreForCategory("chance", exampleDiceValues), 21);
  });

  it("rejects invalid dice values", () => {
    throws(() => calculateAllCategoryScores([6, 6, 3, 3]));
    throws(() => calculateAllCategoryScores([6, 6, 3, 3, 7]));
  });

  it("marks used categories as unavailable", () => {
    const chanceSuggestion = getAvailableScoreSuggestions({ chance: 21 }, exampleDiceValues).find(
      (suggestion) => suggestion.category === "chance"
    );

    strictEqual(chanceSuggestion?.used, true);
  });

  it("recommends exactly one highest scoring available category", () => {
    strictEqual(getRecommendedCategory({}, exampleDiceValues), "fullHouse");
  });

  it("uses strategic tie breakers for four of a kind, three of a kind and chance", () => {
    const diceValues = [6, 6, 6, 6, 2];

    strictEqual(getRecommendedCategory({}, diceValues), "fourOfAKind");
    strictEqual(getRecommendedCategory({ fourOfAKind: 26 }, diceValues), "threeOfAKind");
    strictEqual(
      getRecommendedCategory({ fourOfAKind: 26, threeOfAKind: 26 }, diceValues),
      "chance"
    );
    strictEqual(calculateCategoryPriority("fourOfAKind"), 3);
  });
});

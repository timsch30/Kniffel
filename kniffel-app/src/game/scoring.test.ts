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
    strictEqual(getRecommendedCategory({}, exampleDiceValues), "threes");
  });

  it("prioritizes open upper categories with at least three matching dice", () => {
    strictEqual(getRecommendedCategory({}, [6, 6, 6, 2, 4]), "sixes");
    strictEqual(getRecommendedCategory({}, [1, 1, 1, 4, 6]), "ones");
  });

  it("always puts scoring kniffel and large straight before upper bonus options", () => {
    strictEqual(getRecommendedCategory({}, [6, 6, 6, 6, 6]), "kniffel");
    strictEqual(getRecommendedCategory({}, [2, 3, 4, 5, 6]), "largeStraight");
  });

  it("weights upper categories by their contribution to the upper bonus target", () => {
    const recommendations = getAvailableScoreSuggestions({}, [3, 3, 3, 6, 6])
      .filter((suggestion) => !suggestion.used)
      .sort((left, right) => right.priority - left.priority);

    strictEqual(recommendations[0]?.category, "threes");
    strictEqual(recommendations[0]?.reason, "Fuer Bonus");
  });

  it("keeps four of a kind relevant when the matching upper category is already filled", () => {
    const diceValues = [6, 6, 6, 6, 2];

    strictEqual(getRecommendedCategory({}, diceValues), "sixes");
    strictEqual(getRecommendedCategory({ sixes: 24 }, diceValues), "fourOfAKind");
    strictEqual(
      getRecommendedCategory({ fourOfAKind: 26, sixes: 24 }, diceValues),
      "threeOfAKind"
    );
    strictEqual(calculateCategoryPriority("chance"), -2);
  });

  it("puts strike suggestions before chance on bad rolls", () => {
    const recommendations = getAvailableScoreSuggestions({}, [1, 1, 2, 3, 5])
      .filter((suggestion) => !suggestion.used)
      .sort((left, right) => right.priority - left.priority);

    strictEqual(recommendations[0]?.category, "largeStraight");
    strictEqual(recommendations[0]?.action, "strike");
  });
});

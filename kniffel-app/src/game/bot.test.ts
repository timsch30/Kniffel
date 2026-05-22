import { deepEqual, ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";

import {
  bot_decision,
  choose_best_category,
  choose_best_hold,
  get_available_categories,
  possible_holds,
  score_category
} from "@/game/bot";

describe("bot scoring", () => {
  const dice = [2, 2, 3, 3, 3];

  it("scores all base categories correctly", () => {
    strictEqual(score_category("ones", dice), 0);
    strictEqual(score_category("twos", dice), 4);
    strictEqual(score_category("threes", dice), 9);
    strictEqual(score_category("fours", dice), 0);
    strictEqual(score_category("fives", dice), 0);
    strictEqual(score_category("sixes", dice), 0);
    strictEqual(score_category("threeOfAKind", dice), 13);
    strictEqual(score_category("fourOfAKind", dice), 0);
    strictEqual(score_category("fullHouse", dice), 25);
    strictEqual(score_category("smallStraight", [1, 2, 3, 4, 6]), 30);
    strictEqual(score_category("largeStraight", [2, 3, 4, 5, 6]), 40);
    strictEqual(score_category("kniffel", [6, 6, 6, 6, 6]), 50);
    strictEqual(score_category("chance", dice), 13);
  });
});

describe("bot decisions", () => {
  it("returns only free categories", () => {
    deepEqual(get_available_categories({ ones: 3, twos: 0 }), [
      "threes",
      "fours",
      "fives",
      "sixes",
      "threeOfAKind",
      "fourOfAKind",
      "fullHouse",
      "smallStraight",
      "largeStraight",
      "kniffel",
      "chance"
    ]);
  });

  it("generates at most 32 unique holds", () => {
    const holds = possible_holds([1, 1, 3, 5, 6]);

    ok(holds.length <= 32);
    ok(holds.some((hold) => hold.length === 0));
    ok(holds.some((hold) => hold.join(",") === "1,1,3,5,6"));
  });

  it("chooses a high-value category for five sixes", () => {
    const decision = choose_best_category([6, 6, 6, 6, 6], { scorecard: {} });

    ok(["kniffel", "sixes", "chance", "fourOfAKind", "threeOfAKind"].includes(decision.category));
    ok(decision.points >= 30);
  });

  it("hold decision keeps promising triples", () => {
    const decision = choose_best_hold([6, 6, 6, 1, 2], 2, { scorecard: {} });

    strictEqual(decision.action, "hold");
    ok(decision.hold.filter((value) => value === 6).length >= 3);
  });

  it("bot_decision returns score action on last roll", () => {
    const decision = bot_decision([2, 2, 2, 5, 6], 0, { scorecard: {} });

    strictEqual(decision.action, "score");
  });
});

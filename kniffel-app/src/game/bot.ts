import { scoreCategories, upperScoreCategories } from "@/game/scorecard";
import { calculateScoreForCategory } from "@/game/scoring";
import type { ScoreCard, ScoreCategory } from "@/game/types";

export type BotDifficulty = "medium" | "hard";
export type DiceTuple = readonly [number, number, number, number, number];

type BotState = {
  difficulty?: BotDifficulty;
  scorecard: ScoreCard;
};

type HoldDecision = {
  action: "hold";
  expected_value: number;
  hold: number[];
  reason: string;
  reroll: number[];
};

type ScoreDecision = {
  action: "score";
  category: ScoreCategory;
  points: number;
  reason: string;
  strategic_value: number;
};

export type BotDecision = HoldDecision | ScoreDecision;

const upperTargets: Record<(typeof upperScoreCategories)[number], number> = {
  ones: 3,
  twos: 6,
  threes: 9,
  fours: 12,
  fives: 15,
  sixes: 18
};

const outcomeCache = new Map<number, Array<{ dice: number[]; probability: number }>>();
const memo = new Map<string, number>();

function sortedDice(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

function encodeScoreCard(scorecard: ScoreCard): string {
  return scoreCategories.map((c) => (scorecard[c] == null ? "x" : String(scorecard[c]))).join("|");
}

export function score_category(category: ScoreCategory, dice: number[]): number {
  return calculateScoreForCategory(category, dice);
}

export function get_available_categories(scorecard: ScoreCard): ScoreCategory[] {
  return scoreCategories.filter((category) => scorecard[category] == null);
}

export function possible_holds(dice: number[]): number[][] {
  const holds = new Set<string>();
  const sorted = sortedDice(dice);

  for (let mask = 0; mask < 1 << 5; mask += 1) {
    const hold: number[] = [];

    for (let index = 0; index < 5; index += 1) {
      if (mask & (1 << index)) {
        hold.push(sorted[index]);
      }
    }

    holds.add(hold.join(","));
  }

  return Array.from(holds).map((entry) => (entry ? entry.split(",").map(Number) : []));
}

function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;

  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - (k - i))) / i;
  }

  return result;
}

function generateMultisetOutcomes(n: number): Array<{ dice: number[]; probability: number }> {
  const results: Array<{ dice: number[]; probability: number }> = [];
  const counts = [0, 0, 0, 0, 0, 0];

  function rec(face: number, remaining: number) {
    if (face === 5) {
      counts[face] = remaining;
      const permutations = combinations(n, counts[0]) * combinations(n - counts[0], counts[1]) * combinations(n - counts[0] - counts[1], counts[2]) * combinations(n - counts[0] - counts[1] - counts[2], counts[3]) * combinations(n - counts[0] - counts[1] - counts[2] - counts[3], counts[4]);
      const probability = permutations / 6 ** n;
      const dice: number[] = [];

      counts.forEach((count, idx) => {
        for (let c = 0; c < count; c += 1) {
          dice.push(idx + 1);
        }
      });

      results.push({ dice, probability });
      return;
    }

    for (let count = 0; count <= remaining; count += 1) {
      counts[face] = count;
      rec(face + 1, remaining - count);
    }
  }

  rec(0, n);
  return results;
}

function outcomesForReroll(count: number): Array<{ dice: number[]; probability: number }> {
  const cached = outcomeCache.get(count);

  if (cached) {
    return cached;
  }

  const computed = generateMultisetOutcomes(count);
  outcomeCache.set(count, computed);
  return computed;
}

function getUpperProgress(scorecard: ScoreCard): { current: number; remainingPotential: number } {
  const current = upperScoreCategories.reduce((sum, category) => sum + (scorecard[category] ?? 0), 0);
  const remainingPotential = upperScoreCategories.reduce(
    (sum, category) => sum + (scorecard[category] == null ? 5 * Number(category === "ones" ? 1 : category === "twos" ? 2 : category === "threes" ? 3 : category === "fours" ? 4 : category === "fives" ? 5 : 6) : 0),
    0
  );

  return { current, remainingPotential };
}

function strategicCategoryValue(category: ScoreCategory, points: number, scorecard: ScoreCard): number {
  let value = points;

  if (upperScoreCategories.includes(category as (typeof upperScoreCategories)[number])) {
    const upperCategory = category as (typeof upperScoreCategories)[number];
    const target = upperTargets[upperCategory];
    const delta = points - target;
    const progress = getUpperProgress(scorecard);
    const bonusReachable = progress.current + progress.remainingPotential >= 63;

    value += delta * (bonusReachable ? 1.8 : 0.7);

    if (bonusReachable) {
      value += Math.max(0, points) * 0.2;
    }
  }

  if (points === 0) {
    const sacrificeWeight: Partial<Record<ScoreCategory, number>> = {
      chance: -8,
      fullHouse: -10,
      kniffel: -6,
      largeStraight: -9,
      ones: -1,
      smallStraight: -9,
      threeOfAKind: -4,
      twos: -2
    };

    value += sacrificeWeight[category] ?? -7;
  }

  return value;
}

export function choose_best_category(dice: number[], state: BotState): ScoreDecision {
  const available = get_available_categories(state.scorecard);
  const ranked = available
    .map((category) => {
      const points = score_category(category, dice);
      const strategicValue = strategicCategoryValue(category, points, state.scorecard);

      return { category, points, strategicValue };
    })
    .sort((a, b) => b.strategicValue - a.strategicValue || b.points - a.points);

  const best = ranked[0]!;

  return {
    action: "score",
    category: best.category,
    points: best.points,
    reason: "Hoechster strategischer Erwartungswert unter den freien Kategorien.",
    strategic_value: best.strategicValue
  };
}

export function evaluate_position(dice: number[], rolls_left: number, state: BotState): number {
  const key = `${sortedDice(dice).join(",")}|${rolls_left}|${encodeScoreCard(state.scorecard)}|${state.difficulty ?? "hard"}`;
  const cached = memo.get(key);

  if (cached !== undefined) {
    return cached;
  }

  let value = 0;

  if (rolls_left <= 0) {
    value = choose_best_category(dice, state).strategic_value;
  } else {
    value = choose_best_hold(dice, rolls_left, state).expected_value;
  }

  memo.set(key, value);
  return value;
}

export function expected_value_for_hold(hold: number[], rolls_left: number, state: BotState): number {
  const rerollCount = 5 - hold.length;
  const outcomes = outcomesForReroll(rerollCount);

  return outcomes.reduce((sum, outcome) => {
    const nextDice = sortedDice([...hold, ...outcome.dice]);
    const nextValue = evaluate_position(nextDice, rolls_left - 1, state);

    return sum + outcome.probability * nextValue;
  }, 0);
}

export function choose_best_hold(dice: number[], rolls_left: number, state: BotState): HoldDecision {
  const allHolds = possible_holds(dice);
  const ranked = allHolds
    .map((hold) => ({
      expected_value: expected_value_for_hold(hold, rolls_left, state),
      hold
    }))
    .sort((a, b) => b.expected_value - a.expected_value);
  const best = ranked[0]!;
  const holdSet = new Map<number, number>();

  best.hold.forEach((value) => holdSet.set(value, (holdSet.get(value) ?? 0) + 1));

  const reroll = sortedDice(dice).filter((value) => {
    const count = holdSet.get(value) ?? 0;

    if (count <= 0) return true;
    holdSet.set(value, count - 1);
    return false;
  });

  return {
    action: "hold",
    expected_value: best.expected_value,
    hold: best.hold,
    reason: "Diese Halteoption maximiert den erwarteten strategischen Wert fuer die verbleibenden Wuerfe.",
    reroll
  };
}

export function bot_decision(dice: number[], rolls_left: number, state: BotState): BotDecision {
  if (rolls_left <= 0) {
    return choose_best_category(dice, state);
  }

  return choose_best_hold(dice, rolls_left, state);
}

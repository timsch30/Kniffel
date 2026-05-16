import {
  calculateTotalScore as calculateScoreCardTotal,
  calculateUpperBonus as calculateScoreCardUpperBonus,
  isCategoryFilled,
  scoreCategories,
  scoreCategoryLabels,
  upperScoreCategories
} from "@/game/scorecard";
import type { ScoreCard, ScoreCategory } from "@/game/types";

export type ScoreSuggestionAction = "score" | "strike";

export type ScoreSuggestion = {
  action: ScoreSuggestionAction;
  category: ScoreCategory;
  label: string;
  priority: number;
  reason: string;
  score: number;
  used: boolean;
};

function sumDice(dice: number[]): number {
  return dice.reduce((sum, value) => sum + value, 0);
}

function sumMatchingValue(dice: number[], target: number): number {
  return dice.filter((value) => value === target).length * target;
}

function countsByValue(dice: number[]): Map<number, number> {
  const counts = new Map<number, number>();

  dice.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return counts;
}

function hasOfAKind(dice: number[], amount: number): boolean {
  return Array.from(countsByValue(dice).values()).some((count) => count >= amount);
}

function hasStraight(dice: number[], sequences: number[][]): boolean {
  const values = new Set(dice);

  return sequences.some((sequence) => sequence.every((value) => values.has(value)));
}

const upperCategoryTargets: Record<(typeof upperScoreCategories)[number], number> = {
  fives: 5,
  fours: 4,
  ones: 1,
  sixes: 6,
  threes: 3,
  twos: 2
};

function isUpperCategory(category: ScoreCategory): category is (typeof upperScoreCategories)[number] {
  return Object.prototype.hasOwnProperty.call(upperCategoryTargets, category);
}

function getMatchingUpperCount(category: ScoreCategory, diceValues: number[]): number {
  return isUpperCategory(category)
    ? diceValues.filter((value) => value === upperCategoryTargets[category]).length
    : 0;
}

function getUpperScore(scoreCard: ScoreCard): number {
  return upperScoreCategories.reduce((sum, category) => sum + (scoreCard[category] ?? 0), 0);
}

function getUpperCategoryTarget(category: (typeof upperScoreCategories)[number]): number {
  return upperCategoryTargets[category] * 3;
}

function calculateUpperBonusPriority(
  scoreCard: ScoreCard,
  diceValues: number[],
  category: (typeof upperScoreCategories)[number],
  score: number
): number {
  const upperScore = getUpperScore(scoreCard);
  const openUpperCategories = upperScoreCategories.filter(
    (upperCategory) => !isCategoryUsed(scoreCard, upperCategory)
  );
  const remainingTarget = Math.max(0, 63 - upperScore);
  const plannedOpenTarget = openUpperCategories.reduce(
    (sum, upperCategory) => sum + getUpperCategoryTarget(upperCategory),
    0
  );
  const categoryTarget = getUpperCategoryTarget(category);
  const targetContribution = score - categoryTarget;
  const bonusPressure = Math.max(0, remainingTarget - plannedOpenTarget);
  const upperCount = getMatchingUpperCount(category, diceValues);
  const basePriority = upperCount >= 3 ? 820 : upperCount === 2 ? 180 : 70;

  return (
    basePriority +
    upperCount * 70 +
    Math.max(0, targetContribution) * 16 -
    Math.max(0, -targetContribution) * 24 +
    bonusPressure * 10 +
    upperCategoryTargets[category]
  );
}

export function calculateOnes(dice: number[]): number {
  return sumMatchingValue(dice, 1);
}

export function calculateTwos(dice: number[]): number {
  return sumMatchingValue(dice, 2);
}

export function calculateThrees(dice: number[]): number {
  return sumMatchingValue(dice, 3);
}

export function calculateFours(dice: number[]): number {
  return sumMatchingValue(dice, 4);
}

export function calculateFives(dice: number[]): number {
  return sumMatchingValue(dice, 5);
}

export function calculateSixes(dice: number[]): number {
  return sumMatchingValue(dice, 6);
}

export function calculateChance(dice: number[]): number {
  return sumDice(dice);
}

export function calculateThreeOfAKind(dice: number[]): number {
  return hasOfAKind(dice, 3) ? sumDice(dice) : 0;
}

export function calculateFourOfAKind(dice: number[]): number {
  return hasOfAKind(dice, 4) ? sumDice(dice) : 0;
}

export function calculateFullHouse(dice: number[]): number {
  const counts = Array.from(countsByValue(dice).values()).sort((a, b) => a - b);

  return counts.length === 2 && counts[0] === 2 && counts[1] === 3 ? 25 : 0;
}

export function calculateSmallStraight(dice: number[]): number {
  return hasStraight(dice, [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6]
  ])
    ? 30
    : 0;
}

export function calculateLargeStraight(dice: number[]): number {
  return hasStraight(dice, [
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 6]
  ])
    ? 40
    : 0;
}

export function calculateKniffel(dice: number[]): number {
  return hasOfAKind(dice, 5) ? 50 : 0;
}

export function isValidDiceValues(diceValues: number[]): boolean {
  return (
    diceValues.length === 5 &&
    diceValues.every((value) => Number.isInteger(value) && value >= 1 && value <= 6)
  );
}

export function assertValidDiceValues(diceValues: number[]): void {
  if (!isValidDiceValues(diceValues)) {
    throw new Error("Es muessen genau 5 Augenzahlen zwischen 1 und 6 sein.");
  }
}

export function calculateScoreForCategory(
  category: ScoreCategory,
  diceValues: number[]
): number {
  assertValidDiceValues(diceValues);

  const calculators: Record<ScoreCategory, (dice: number[]) => number> = {
    chance: calculateChance,
    fives: calculateFives,
    fourOfAKind: calculateFourOfAKind,
    fours: calculateFours,
    fullHouse: calculateFullHouse,
    kniffel: calculateKniffel,
    largeStraight: calculateLargeStraight,
    ones: calculateOnes,
    sixes: calculateSixes,
    smallStraight: calculateSmallStraight,
    threeOfAKind: calculateThreeOfAKind,
    threes: calculateThrees,
    twos: calculateTwos
  };

  return calculators[category](diceValues);
}

export function calculateAllCategoryScores(
  diceValues: number[]
): Record<ScoreCategory, number> {
  assertValidDiceValues(diceValues);

  return Object.fromEntries(
    scoreCategories.map((category) => [category, calculateScoreForCategory(category, diceValues)])
  ) as Record<ScoreCategory, number>;
}

export function calculatePossibleScores(diceValues: number[]): Record<ScoreCategory, number> {
  return calculateAllCategoryScores(diceValues);
}

export function calculateUpperBonus(scoreCard: ScoreCard): number {
  return calculateScoreCardUpperBonus(scoreCard);
}

export function calculateTotalScore(scoreCard: ScoreCard): number {
  return calculateScoreCardTotal(scoreCard);
}

export function isCategoryUsed(scoreCard: ScoreCard, category: ScoreCategory): boolean {
  return isCategoryFilled(scoreCard, category);
}

export function calculateCategoryPriority(category: ScoreCategory): number {
  const priorities: Partial<Record<ScoreCategory, number>> = {
    chance: -2,
    fourOfAKind: 4,
    threeOfAKind: 1
  };

  return priorities[category] ?? 0;
}

function hasOpenUpperTriple(
  scoreCard: ScoreCard,
  diceValues: number[],
  categoryToIgnore?: ScoreCategory
): boolean {
  return upperScoreCategories.some(
    (category) =>
      category !== categoryToIgnore &&
      !isCategoryUsed(scoreCard, category) &&
      getMatchingUpperCount(category, diceValues) >= 3
  );
}

function hasMeaningfulOpenScore(
  scoreCard: ScoreCard,
  diceValues: number[],
  scores: Record<ScoreCategory, number>
): boolean {
  return scoreCategories.some((category) => {
    if (category === "chance" || isCategoryUsed(scoreCard, category)) {
      return false;
    }

    if (isUpperCategory(category)) {
      return getMatchingUpperCount(category, diceValues) >= 3;
    }

    return scores[category] >= 18;
  });
}

function calculateSuggestionPriority(
  scoreCard: ScoreCard,
  diceValues: number[],
  scores: Record<ScoreCategory, number>,
  category: ScoreCategory
): number {
  const score = scores[category];
  const upperCount = getMatchingUpperCount(category, diceValues);
  const badRoll = !hasMeaningfulOpenScore(scoreCard, diceValues, scores) && scores.chance < 20;

  if (score === 0) {
    if (badRoll && category === "largeStraight") {
      return 360;
    }

    if (badRoll && category === "kniffel") {
      return 340;
    }

    return -100 + calculateCategoryPriority(category);
  }

  if (category === "kniffel") {
    return 2000;
  }

  if (category === "largeStraight") {
    return 1900;
  }

  if (isUpperCategory(category) && upperCount >= 3) {
    return calculateUpperBonusPriority(scoreCard, diceValues, category, score);
  }

  if (category === "fullHouse") {
    return 880;
  }

  if (category === "fourOfAKind") {
    return 700 + score;
  }

  if (category === "smallStraight") {
    return 620;
  }

  if (category === "threeOfAKind") {
    return hasOpenUpperTriple(scoreCard, diceValues, category) ? 420 + score : 540 + score;
  }

  if (isUpperCategory(category)) {
    return calculateUpperBonusPriority(scoreCard, diceValues, category, score);
  }

  if (category === "chance") {
    return score >= 24 ? 260 + score : 80 + score;
  }

  return score + calculateCategoryPriority(category);
}

function describeSuggestion(
  scoreCard: ScoreCard,
  diceValues: number[],
  category: ScoreCategory,
  score: number
): string {
  const upperCount = getMatchingUpperCount(category, diceValues);

  if (score === 0) {
    return "Streichen";
  }

  if (category === "kniffel" || category === "largeStraight") {
    return "Top-Wurf";
  }

  if (isUpperCategory(category) && upperCount >= 3) {
    return "Fuer Bonus";
  }

  if (category === "threeOfAKind" && hasOpenUpperTriple(scoreCard, diceValues, category)) {
    return "Nach Bonus";
  }

  if (category === "chance") {
    return "Reserve";
  }

  return "";
}

export function getAvailableScoreSuggestions(
  scoreCard: ScoreCard,
  diceValues: number[]
): ScoreSuggestion[] {
  const scores = calculateAllCategoryScores(diceValues);

  return scoreCategories.map((category) => ({
    action: scores[category] === 0 ? "strike" : "score",
    category,
    label: scoreCategoryLabels[category],
    priority: calculateSuggestionPriority(scoreCard, diceValues, scores, category),
    reason: describeSuggestion(scoreCard, diceValues, category, scores[category]),
    score: scores[category],
    used: isCategoryUsed(scoreCard, category)
  }));
}

export function getRankedScoreSuggestions(
  scoreCard: ScoreCard,
  diceValues: number[]
): ScoreSuggestion[] {
  return getAvailableScoreSuggestions(scoreCard, diceValues)
    .filter((suggestion) => !suggestion.used)
    .sort((left, right) => {
      const priorityDifference = right.priority - left.priority;

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const scoreDifference = right.score - left.score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return scoreCategories.indexOf(left.category) - scoreCategories.indexOf(right.category);
    });
}

export function getRecommendedCategory(
  scoreCard: ScoreCard,
  diceValues: number[]
): ScoreCategory | null {
  const suggestions = getRankedScoreSuggestions(scoreCard, diceValues);

  if (suggestions.length === 0) {
    return null;
  }

  const [recommended] = suggestions;

  return recommended.category;
}

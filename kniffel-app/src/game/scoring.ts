import {
  calculateTotalScore as calculateScoreCardTotal,
  calculateUpperBonus as calculateScoreCardUpperBonus,
  isCategoryFilled,
  scoreCategories,
  scoreCategoryLabels
} from "@/game/scorecard";
import type { ScoreCard, ScoreCategory } from "@/game/types";

export type ScoreSuggestion = {
  category: ScoreCategory;
  label: string;
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
    chance: 1,
    fourOfAKind: 3,
    threeOfAKind: 2
  };

  return priorities[category] ?? 0;
}

export function getAvailableScoreSuggestions(
  scoreCard: ScoreCard,
  diceValues: number[]
): ScoreSuggestion[] {
  const scores = calculateAllCategoryScores(diceValues);

  return scoreCategories.map((category) => ({
    category,
    label: scoreCategoryLabels[category],
    score: scores[category],
    used: isCategoryUsed(scoreCard, category)
  }));
}

export function getRecommendedCategory(
  scoreCard: ScoreCard,
  diceValues: number[]
): ScoreCategory | null {
  const suggestions = getAvailableScoreSuggestions(scoreCard, diceValues).filter(
    (suggestion) => !suggestion.used
  );

  if (suggestions.length === 0) {
    return null;
  }

  const [recommended] = suggestions.sort((left, right) => {
    const scoreDifference = right.score - left.score;

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const priorityDifference =
      calculateCategoryPriority(right.category) - calculateCategoryPriority(left.category);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return scoreCategories.indexOf(left.category) - scoreCategories.indexOf(right.category);
  });

  return recommended.category;
}

import type { ScoreCard, ScoreCategory } from "@/game/types";

export const scoreCategories = [
  "ones",
  "twos",
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
] as const satisfies readonly ScoreCategory[];

export const upperScoreCategories = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes"
] as const satisfies readonly ScoreCategory[];

export const scoreCategoryLabels: Record<ScoreCategory, string> = {
  chance: "Chance",
  fives: "Fuenfer",
  fourOfAKind: "Viererpasch",
  fours: "Vierer",
  fullHouse: "Full House",
  kniffel: "Kniffel",
  largeStraight: "Grosse Strasse",
  ones: "Einser",
  sixes: "Sechser",
  smallStraight: "Kleine Strasse",
  threeOfAKind: "Dreierpasch",
  threes: "Dreier",
  twos: "Zweier"
};

export type TurnPlayer = {
  id: string;
  position: number;
};

export function isScoreCategory(value: string): value is ScoreCategory {
  return scoreCategories.some((category) => category === value);
}

export function normalizeStruckCategories(value: unknown): ScoreCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is ScoreCategory => typeof entry === "string" && isScoreCategory(entry)
  );
}

export function updateStruckCategories(
  value: unknown,
  category: ScoreCategory,
  struck: boolean
): ScoreCategory[] {
  const currentCategories = normalizeStruckCategories(value);
  const currentSet = new Set(currentCategories);

  if (struck) {
    currentSet.add(category);
  } else {
    currentSet.delete(category);
  }

  return scoreCategories.filter((entry) => currentSet.has(entry));
}

export function isCategoryFilled(scoreCard: ScoreCard, category: ScoreCategory): boolean {
  return scoreCard[category] !== null && scoreCard[category] !== undefined;
}

export function calculateUpperBonus(scoreCard: ScoreCard): number {
  const upperScore = upperScoreCategories.reduce(
    (sum, category) => sum + (scoreCard[category] ?? 0),
    0
  );

  return upperScore >= 63 ? 35 : 0;
}

export function calculateTotalScore(scoreCard: ScoreCard): number {
  const categoryScore = scoreCategories.reduce(
    (sum, category) => sum + (scoreCard[category] ?? 0),
    0
  );

  return categoryScore + calculateUpperBonus(scoreCard);
}

export function updateScoreCard(
  scoreCard: ScoreCard,
  category: ScoreCategory,
  points: number
): ScoreCard {
  const nextScoreCard: ScoreCard = {
    ...scoreCard,
    [category]: points
  };

  return {
    ...nextScoreCard,
    total: calculateTotalScore(nextScoreCard),
    upperBonus: calculateUpperBonus(nextScoreCard)
  };
}

export function isScoreCardComplete(scoreCard: ScoreCard): boolean {
  return scoreCategories.every((category) => isCategoryFilled(scoreCard, category));
}

export function determineNextPlayer(
  players: TurnPlayer[],
  currentPlayerId: string
): { nextPlayerId: string; completedRotation: boolean } {
  const orderedPlayers = [...players].sort((a, b) => a.position - b.position);
  const currentIndex = orderedPlayers.findIndex((player) => player.id === currentPlayerId);

  if (orderedPlayers.length === 0 || currentIndex === -1) {
    throw new Error("Aktueller Spieler konnte nicht bestimmt werden.");
  }

  const nextIndex = (currentIndex + 1) % orderedPlayers.length;

  return {
    completedRotation: nextIndex === 0,
    nextPlayerId: orderedPlayers[nextIndex].id
  };
}

export function areAllScoreCardsComplete(scoreCards: ScoreCard[]): boolean {
  return scoreCards.length > 0 && scoreCards.every((scoreCard) => isScoreCardComplete(scoreCard));
}

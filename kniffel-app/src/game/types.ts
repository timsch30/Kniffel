export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

export type DiceRoll = DiceValue[];

export type ScoreCategory =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  | "threeOfAKind"
  | "fourOfAKind"
  | "fullHouse"
  | "smallStraight"
  | "largeStraight"
  | "kniffel"
  | "chance";

export type ScoreCard = Partial<Record<ScoreCategory, number | null>> & {
  upperBonus?: number | null;
  total?: number | null;
};

import type {
  AchievementCategory,
  AchievementRarity,
  PlayerStats
} from "@/social/types";

export type AchievementCategoryConfig = {
  id: AchievementCategory;
  label: string;
};

export type AchievementDefinition = {
  category: AchievementCategory;
  description: string;
  getValue: (stats: PlayerStats) => number;
  hidden?: boolean;
  id: string;
  label: string;
  rarity: AchievementRarity;
  target: number;
};

export const achievementCategories = [
  { id: "entry", label: "Einstieg" },
  { id: "progress", label: "Fortschritt" },
  { id: "points", label: "Punkte" },
  { id: "streaks", label: "Serien" },
  { id: "luck", label: "Wuerfelglueck" },
  { id: "categories", label: "Kategorien" },
  { id: "secret", label: "Geheim" }
] as const satisfies readonly AchievementCategoryConfig[];

export const achievementCategoryLabels = Object.fromEntries(
  achievementCategories.map((category) => [category.id, category.label])
) as Record<AchievementCategory, string>;

export const achievementDefinitions = [
  {
    category: "entry",
    description: "Beende deine erste Runde.",
    getValue: (stats) => stats.gamesPlayed,
    id: "first-game",
    label: "Erste Runde",
    rarity: "common",
    target: 1
  },
  {
    category: "entry",
    description: "Gewinne deine erste Runde.",
    getValue: (stats) => stats.gamesWon,
    id: "first-win",
    label: "Erster Sieg",
    rarity: "common",
    target: 1
  },
  {
    category: "entry",
    description: "Wuerfle deinen ersten Kniffel.",
    getValue: (stats) => stats.totalKniffel,
    id: "first-kniffel",
    label: "Erster Kniffel",
    rarity: "common",
    target: 1
  },
  {
    category: "progress",
    description: "Bleib dran ueber 10 Spiele.",
    getValue: (stats) => stats.gamesPlayed,
    id: "ten-games",
    label: "10 Spiele gespielt",
    rarity: "rare",
    target: 10
  },
  {
    category: "progress",
    description: "Spiele 50 abgeschlossene Runden.",
    getValue: (stats) => stats.gamesPlayed,
    id: "fifty-games",
    label: "50 Spiele gespielt",
    rarity: "rare",
    target: 50
  },
  {
    category: "progress",
    description: "Spiele 100 abgeschlossene Runden.",
    getValue: (stats) => stats.gamesPlayed,
    id: "hundred-games",
    label: "100 Spiele gespielt",
    rarity: "epic",
    target: 100
  },
  {
    category: "progress",
    description: "Sammle 10 Siege.",
    getValue: (stats) => stats.gamesWon,
    id: "ten-wins",
    label: "10 Siege",
    rarity: "rare",
    target: 10
  },
  {
    category: "progress",
    description: "Sammle 50 Siege.",
    getValue: (stats) => stats.gamesWon,
    id: "fifty-wins",
    label: "50 Siege",
    rarity: "rare",
    target: 50
  },
  {
    category: "progress",
    description: "Sammle 100 Siege.",
    getValue: (stats) => stats.gamesWon,
    id: "hundred-wins",
    label: "100 Siege",
    rarity: "epic",
    target: 100
  },
  {
    category: "points",
    description: "Erreiche mindestens 200 Punkte.",
    getValue: (stats) => stats.highestScore,
    id: "score-200",
    label: "200 Punkte erreicht",
    rarity: "common",
    target: 200
  },
  {
    category: "points",
    description: "Erreiche mindestens 250 Punkte.",
    getValue: (stats) => stats.highestScore,
    id: "score-250",
    label: "250 Punkte erreicht",
    rarity: "rare",
    target: 250
  },
  {
    category: "points",
    description: "Erreiche mindestens 300 Punkte.",
    getValue: (stats) => stats.highestScore,
    id: "score-300",
    label: "300 Punkte geknackt",
    rarity: "epic",
    target: 300
  },
  {
    category: "points",
    description: "Erreiche mindestens 350 Punkte.",
    getValue: (stats) => stats.highestScore,
    id: "score-350",
    label: "350 Punkte geknackt",
    rarity: "epic",
    target: 350
  },
  {
    category: "streaks",
    description: "Gewinne 3 Spiele in Folge.",
    getValue: (stats) => stats.longestWinStreak,
    id: "three-streak",
    label: "3 Siege in Folge",
    rarity: "epic",
    target: 3
  },
  {
    category: "streaks",
    description: "Gewinne 5 Spiele in Folge.",
    getValue: (stats) => stats.longestWinStreak,
    id: "five-streak",
    label: "5 Siege in Folge",
    rarity: "epic",
    target: 5
  },
  {
    category: "streaks",
    description: "Gewinne 10 Spiele in Folge.",
    getValue: (stats) => stats.longestWinStreak,
    id: "ten-streak",
    label: "10 Siege in Folge",
    rarity: "epic",
    target: 10
  },
  {
    category: "luck",
    description: "Wuerfle 2 Kniffel in einem Spiel.",
    getValue: (stats) => stats.bestGameKniffel,
    id: "double-kniffel",
    label: "Doppel-Kniffel",
    rarity: "rare",
    target: 2
  },
  {
    category: "luck",
    description: "Wuerfle insgesamt 25 Kniffel.",
    getValue: (stats) => stats.totalKniffel,
    id: "twentyfive-kniffel",
    label: "25 Kniffel gewuerfelt",
    rarity: "rare",
    target: 25
  },
  {
    category: "luck",
    description: "Wuerfle insgesamt 100 Kniffel.",
    getValue: (stats) => stats.totalKniffel,
    id: "hundred-kniffel",
    label: "100 Kniffel gewuerfelt",
    rarity: "epic",
    target: 100
  },
  {
    category: "luck",
    description: "Wuerfle 3 Kniffel in einem Spiel.",
    getValue: (stats) => stats.bestGameKniffel,
    id: "luck-god",
    label: "Gluecksgott",
    rarity: "epic",
    target: 3
  },
  {
    category: "categories",
    description: "Erreiche kleine und grosse Strasse in einem Spiel.",
    getValue: (stats) => stats.straightBuilderGames,
    id: "street-builder",
    label: "Strassenbauer",
    rarity: "rare",
    target: 1
  },
  {
    category: "categories",
    description: "Erreiche 10 Full Houses.",
    getValue: (stats) => stats.fullHouseCount,
    id: "full-house-master",
    label: "Full House Meister",
    rarity: "rare",
    target: 10
  },
  {
    category: "categories",
    description: "Hole den oberen Bonus in einem Spiel.",
    getValue: (stats) => stats.perfectUpperBonusGames,
    id: "perfect-upper-bonus",
    label: "Perfekter Bonus",
    rarity: "epic",
    target: 1
  },
  {
    category: "secret",
    description: "Beende ein Spiel exakt mit 375 Punkten.",
    getValue: (stats) => stats.exactScore375Games,
    hidden: true,
    id: "math-anomaly",
    label: "Mathematische Anomalie",
    rarity: "epic",
    target: 1
  }
] as const satisfies readonly AchievementDefinition[];

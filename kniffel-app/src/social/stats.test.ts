import { strictEqual } from "assert";
import { describe, it } from "node:test";

import { calculateAchievements, calculatePlayerStats } from "./stats.ts";
import type { Game, PlayerStats } from "@/social/types";

function createStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    averagePoints: 0,
    bestCategory: "Noch offen",
    bestGameKniffel: 0,
    currentWinStreak: 0,
    doubleKniffelGames: 0,
    exactScore375Games: 0,
    favoriteCategory: "Noch offen",
    fullHouseCount: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    highestScore: 0,
    kniffelPerGame: 0,
    longestWinStreak: 0,
    perfectUpperBonusGames: 0,
    straightBuilderGames: 0,
    totalKniffel: 0,
    totalPoints: 0,
    tripleKniffelGames: 0,
    winRate: 0,
    ...overrides
  };
}

describe("achievement stats", () => {
  it("keeps legacy achievement ids and adds categories", () => {
    const achievements = calculateAchievements(
      createStats({
        gamesPlayed: 10,
        gamesWon: 1,
        highestScore: 300,
        longestWinStreak: 3,
        totalKniffel: 1
      })
    );

    const firstWin = achievements.find((achievement) => achievement.id === "first-win");
    const score300 = achievements.find((achievement) => achievement.id === "score-300");

    strictEqual(firstWin?.earned, true);
    strictEqual(firstWin?.category, "entry");
    strictEqual(score300?.earned, true);
    strictEqual(score300?.category, "points");
  });

  it("keeps hidden achievements concealed until they are earned", () => {
    const locked = calculateAchievements(createStats()).find(
      (achievement) => achievement.id === "math-anomaly"
    );
    const earned = calculateAchievements(createStats({ exactScore375Games: 1 })).find(
      (achievement) => achievement.id === "math-anomaly"
    );

    strictEqual(locked?.hidden, true);
    strictEqual(locked?.earned, false);
    strictEqual(earned?.hidden, true);
    strictEqual(earned?.earned, true);
  });

  it("derives category achievements from finished games", () => {
    const games: Game[] = [
      {
        date: "2026-05-17T12:00:00.000Z",
        highlights: [],
        id: "game-1",
        results: [
          {
            categoryScores: {
              "Full House": 25,
              "Grosse Strasse": 40,
              "Kleine Strasse": 30
            },
            kniffelCount: 1,
            playerId: "user-1",
            score: 375,
            upperBonus: 35
          }
        ],
        winnerId: "user-1"
      }
    ];
    const stats = calculatePlayerStats(games, "user-1");
    const achievements = calculateAchievements(stats);

    strictEqual(stats.fullHouseCount, 1);
    strictEqual(stats.straightBuilderGames, 1);
    strictEqual(stats.perfectUpperBonusGames, 1);
    strictEqual(stats.exactScore375Games, 1);
    strictEqual(achievements.find((achievement) => achievement.id === "street-builder")?.earned, true);
    strictEqual(achievements.find((achievement) => achievement.id === "perfect-upper-bonus")?.earned, true);
    strictEqual(achievements.find((achievement) => achievement.id === "math-anomaly")?.earned, true);
  });
});

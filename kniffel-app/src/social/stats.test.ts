import { strictEqual } from "assert";
import { describe, it } from "node:test";

import {
  calculateAchievements,
  calculateHeadToHeadStats,
  calculateLeaderboard,
  calculatePlayerStats
} from "./stats.ts";
import type { Game, Player, PlayerStats } from "@/social/types";
import { scoreCategories, scoreCategoryLabels } from "@/game/scorecard";

const allCategoriesZero = Object.fromEntries(
  scoreCategories.map((category) => [scoreCategoryLabels[category], 0])
);

function createStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    averagePoints: 0,
    bestCategory: "Noch offen",
    bestGameKniffel: 0,
    currentWinStreak: 0,
    doubleKniffelGames: 0,
    exactScore111Games: 0,
    exactScore222Games: 0,
    exactScore333Games: 0,
    exactScore375Games: 0,
    exactUpper67Games: 0,
    exactUpper69Games: 0,
    favoriteCategory: "Noch offen",
    fullHouseCount: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    highestScore: 0,
    kniffelPerGame: 0,
    longestWinStreak: 0,
    lowScoreUnder150Games: 0,
    perfectUpperBonusGames: 0,
    score330Games: 0,
    straightBuilderGames: 0,
    allCategoriesStruckGames: 0,
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

  it("only keeps 375 and all-struck hidden among the new achievements", () => {
    const achievements = calculateAchievements(
      createStats({
        allCategoriesStruckGames: 1,
        exactScore111Games: 1,
        exactScore222Games: 1,
        exactScore333Games: 1,
        exactScore375Games: 1,
        exactUpper67Games: 1,
        exactUpper69Games: 1,
        highestScore: 330,
        lowScoreUnder150Games: 1
      })
    );
    const byId = new Map(achievements.map((achievement) => [achievement.id, achievement]));

    strictEqual(byId.get("score-330")?.category, "points");
    strictEqual(byId.get("score-330")?.hidden, undefined);
    strictEqual(byId.get("exact-111")?.category, "points");
    strictEqual(byId.get("exact-111")?.hidden, undefined);
    strictEqual(byId.get("exact-222")?.category, "points");
    strictEqual(byId.get("exact-222")?.hidden, undefined);
    strictEqual(byId.get("exact-333")?.category, "points");
    strictEqual(byId.get("exact-333")?.hidden, undefined);
    strictEqual(byId.get("participant-certificate")?.category, "points");
    strictEqual(byId.get("participant-certificate")?.hidden, undefined);
    strictEqual(byId.get("upper-67")?.category, "categories");
    strictEqual(byId.get("upper-67")?.hidden, undefined);
    strictEqual(byId.get("upper-69")?.category, "categories");
    strictEqual(byId.get("upper-69")?.hidden, undefined);
    strictEqual(byId.get("all-struck")?.category, "secret");
    strictEqual(byId.get("all-struck")?.hidden, true);
    strictEqual(byId.get("math-anomaly")?.category, "secret");
    strictEqual(byId.get("math-anomaly")?.hidden, true);
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

  it("keeps player stats scoped to games the player actually played", () => {
    const games: Game[] = [
      {
        date: "2026-05-20T12:00:00.000Z",
        highlights: [],
        id: "game-newest",
        results: [
          {
            categoryScores: {},
            kniffelCount: 0,
            playerId: "user-1",
            score: 210
          },
          {
            categoryScores: {},
            kniffelCount: 1,
            playerId: "user-2",
            score: 240
          }
        ],
        winnerId: "user-2"
      },
      {
        date: "2026-05-19T12:00:00.000Z",
        highlights: [],
        id: "game-user-only",
        results: [
          {
            categoryScores: {},
            kniffelCount: 2,
            playerId: "user-1",
            score: 300
          },
          {
            categoryScores: {},
            kniffelCount: 0,
            playerId: "user-3",
            score: 180
          }
        ],
        winnerId: "user-1"
      },
      {
        date: "2026-05-18T12:00:00.000Z",
        highlights: [],
        id: "game-without-user",
        results: [
          {
            categoryScores: {},
            kniffelCount: 1,
            playerId: "user-2",
            score: 260
          },
          {
            categoryScores: {},
            kniffelCount: 0,
            playerId: "user-3",
            score: 220
          }
        ],
        winnerId: "user-2"
      }
    ];

    const stats = calculatePlayerStats(games, "user-1");

    strictEqual(stats.gamesPlayed, 2);
    strictEqual(stats.gamesWon, 1);
    strictEqual(stats.totalPoints, 510);
    strictEqual(stats.averagePoints, 255);
    strictEqual(stats.highestScore, 300);
    strictEqual(stats.totalKniffel, 2);
    strictEqual(stats.currentWinStreak, 0);
    strictEqual(stats.longestWinStreak, 1);
  });

  it("derives exact score and hidden-achievement source stats", () => {
    const games: Game[] = [
      {
        date: "2026-05-20T12:00:00.000Z",
        highlights: [],
        id: "score-111",
        results: [
          {
            categoryScores: {},
            kniffelCount: 0,
            playerId: "user-1",
            score: 111,
            upperScore: 67
          }
        ],
        winnerId: "user-1"
      },
      {
        date: "2026-05-19T12:00:00.000Z",
        highlights: [],
        id: "score-222",
        results: [
          {
            categoryScores: {},
            kniffelCount: 0,
            playerId: "user-1",
            score: 222,
            upperScore: 69
          }
        ],
        winnerId: "user-1"
      },
      {
        date: "2026-05-18T12:00:00.000Z",
        highlights: [],
        id: "score-333",
        results: [
          {
            categoryScores: {},
            kniffelCount: 0,
            playerId: "user-1",
            score: 333,
            upperScore: 68
          }
        ],
        winnerId: "user-1"
      },
      {
        date: "2026-05-17T12:00:00.000Z",
        highlights: [],
        id: "all-struck",
        results: [
          {
            categoryScores: allCategoriesZero,
            kniffelCount: 0,
            playerId: "user-1",
            score: 0,
            struckCategoryCount: 13
          }
        ],
        winnerId: "user-1"
      }
    ];

    const stats = calculatePlayerStats(games, "user-1");

    strictEqual(stats.exactScore111Games, 1);
    strictEqual(stats.exactScore222Games, 1);
    strictEqual(stats.exactScore333Games, 1);
    strictEqual(stats.score330Games, 1);
    strictEqual(stats.lowScoreUnder150Games, 2);
    strictEqual(stats.exactUpper67Games, 1);
    strictEqual(stats.exactUpper69Games, 1);
    strictEqual(stats.allCategoriesStruckGames, 1);
  });

  it("uses only shared games for head-to-head stats", () => {
    const user: Player = {
      color: "",
      id: "user-1",
      initials: "U1",
      name: "User 1"
    };
    const friend: Player = {
      color: "",
      id: "user-2",
      initials: "U2",
      name: "User 2"
    };
    const games: Game[] = [
      {
        date: "2026-05-20T12:00:00.000Z",
        highlights: [],
        id: "shared",
        results: [
          {
            categoryScores: {},
            kniffelCount: 0,
            playerId: "user-1",
            score: 210
          },
          {
            categoryScores: {},
            kniffelCount: 1,
            playerId: "user-2",
            score: 240
          }
        ],
        winnerId: "user-2"
      },
      {
        date: "2026-05-19T12:00:00.000Z",
        highlights: [],
        id: "friend-only",
        results: [
          {
            categoryScores: {},
            kniffelCount: 3,
            playerId: "user-2",
            score: 360
          }
        ],
        winnerId: "user-2"
      }
    ];

    const stats = calculateHeadToHeadStats(games, user, friend);

    strictEqual(stats.directMatches, 1);
    strictEqual(stats.wins.user, 0);
    strictEqual(stats.wins.friend, 1);
    strictEqual(stats.averagePoints.user, 210);
    strictEqual(stats.averagePoints.friend, 240);
    strictEqual(stats.highestScore.friend, 240);
    strictEqual(stats.kniffel.friend, 1);
  });

  it("sorts leaderboard by wins before averages and kniffel", () => {
    const players: Player[] = [
      { color: "", id: "user-1", initials: "U1", name: "User 1" },
      { color: "", id: "user-2", initials: "U2", name: "User 2" },
      { color: "", id: "user-3", initials: "U3", name: "User 3" }
    ];
    const games: Game[] = [
      {
        date: "2026-05-20T12:00:00.000Z",
        highlights: [],
        id: "game-1",
        results: [
          { categoryScores: {}, kniffelCount: 0, playerId: "user-1", score: 300 },
          { categoryScores: {}, kniffelCount: 1, playerId: "user-2", score: 240 }
        ],
        winnerId: "user-1"
      },
      {
        date: "2026-05-19T12:00:00.000Z",
        highlights: [],
        id: "game-2",
        results: [
          { categoryScores: {}, kniffelCount: 2, playerId: "user-2", score: 260 },
          { categoryScores: {}, kniffelCount: 0, playerId: "user-3", score: 220 }
        ],
        winnerId: "user-2"
      },
      {
        date: "2026-05-18T12:00:00.000Z",
        highlights: [],
        id: "game-3",
        results: [
          { categoryScores: {}, kniffelCount: 0, playerId: "user-2", score: 230 },
          { categoryScores: {}, kniffelCount: 0, playerId: "user-3", score: 210 }
        ],
        winnerId: "user-2"
      }
    ];

    const leaderboard = calculateLeaderboard(players, games);

    strictEqual(leaderboard[0].player.id, "user-2");
    strictEqual(leaderboard[0].wins, 2);
    strictEqual(leaderboard[1].player.id, "user-1");
    strictEqual(leaderboard[1].wins, 1);
    strictEqual(leaderboard[2].player.id, "user-3");
  });
});

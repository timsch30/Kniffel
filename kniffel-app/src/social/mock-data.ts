import type { Friend, Game, Player } from "@/social/types";

export const currentPlayer: Player = {
  color: "bg-ink text-white dark:bg-white dark:text-zinc-950",
  id: "you",
  initials: "DU",
  name: "Du"
};

export const mockFriends: Friend[] = [
  {
    color: "bg-emerald-600 text-white",
    favoriteCategory: "Full House",
    id: "max",
    initials: "MK",
    lastActiveAt: "2026-05-14T18:30:00.000Z",
    name: "Max",
    relationshipStatus: "accepted"
  },
  {
    color: "bg-amber-500 text-white",
    favoriteCategory: "Chance",
    id: "lina",
    initials: "LN",
    lastActiveAt: "2026-05-13T20:10:00.000Z",
    name: "Lina",
    relationshipStatus: "accepted"
  },
  {
    color: "bg-sky-600 text-white",
    favoriteCategory: "Kniffel",
    id: "tom",
    initials: "TB",
    lastActiveAt: "2026-05-12T16:45:00.000Z",
    name: "Tom",
    relationshipStatus: "accepted"
  },
  {
    color: "bg-rose-600 text-white",
    favoriteCategory: "Viererpasch",
    id: "sara",
    initials: "SR",
    lastActiveAt: "2026-05-10T19:05:00.000Z",
    name: "Sara",
    relationshipStatus: "accepted"
  }
];

export const pendingFriends: Friend[] = [
  {
    color: "bg-violet-600 text-white",
    favoriteCategory: "Grosse Strasse",
    id: "nora",
    initials: "NV",
    lastActiveAt: "2026-05-09T12:00:00.000Z",
    name: "Nora",
    relationshipStatus: "incoming"
  }
];

const categories = {
  chance: "Chance",
  fullHouse: "Full House",
  kniffel: "Kniffel",
  smallStraight: "Kleine Strasse",
  threeKind: "Dreierpasch",
  yahtzeeBonus: "Kniffel Bonus"
};

export const mockGames: Game[] = [
  {
    date: "2026-05-14T20:15:00.000Z",
    highlights: ["KNIFFEL", "CLOSE_GAME"],
    id: "game-101",
    results: [
      {
        categoryScores: { [categories.chance]: 28, [categories.fullHouse]: 25, [categories.kniffel]: 50 },
        kniffelCount: 1,
        playerId: "you",
        score: 312
      },
      {
        categoryScores: { [categories.chance]: 24, [categories.fullHouse]: 25, [categories.threeKind]: 21 },
        kniffelCount: 0,
        playerId: "max",
        score: 304
      }
    ],
    winnerId: "you"
  },
  {
    date: "2026-05-12T19:40:00.000Z",
    highlights: ["NEW_RECORD"],
    id: "game-100",
    results: [
      {
        categoryScores: { [categories.chance]: 30, [categories.kniffel]: 50, [categories.yahtzeeBonus]: 100 },
        kniffelCount: 2,
        playerId: "lina",
        score: 356
      },
      {
        categoryScores: { [categories.chance]: 25, [categories.fullHouse]: 25, [categories.smallStraight]: 30 },
        kniffelCount: 0,
        playerId: "you",
        score: 281
      },
      {
        categoryScores: { [categories.chance]: 18, [categories.threeKind]: 19 },
        kniffelCount: 0,
        playerId: "tom",
        score: 244
      }
    ],
    winnerId: "lina"
  },
  {
    date: "2026-05-08T21:05:00.000Z",
    highlights: ["COMEBACK", "KNIFFEL"],
    id: "game-099",
    results: [
      {
        categoryScores: { [categories.chance]: 27, [categories.fullHouse]: 25, [categories.kniffel]: 50 },
        kniffelCount: 1,
        playerId: "you",
        score: 333
      },
      {
        categoryScores: { [categories.chance]: 22, [categories.fullHouse]: 25 },
        kniffelCount: 0,
        playerId: "sara",
        score: 296
      }
    ],
    winnerId: "you"
  },
  {
    date: "2026-05-03T18:20:00.000Z",
    highlights: ["CLOSE_GAME"],
    id: "game-098",
    results: [
      {
        categoryScores: { [categories.chance]: 20, [categories.threeKind]: 18 },
        kniffelCount: 0,
        playerId: "max",
        score: 267
      },
      {
        categoryScores: { [categories.chance]: 23, [categories.fullHouse]: 25 },
        kniffelCount: 0,
        playerId: "you",
        score: 263
      }
    ],
    winnerId: "max"
  },
  {
    date: "2026-04-28T19:10:00.000Z",
    highlights: ["KNIFFEL"],
    id: "game-097",
    results: [
      {
        categoryScores: { [categories.chance]: 29, [categories.kniffel]: 50 },
        kniffelCount: 1,
        playerId: "tom",
        score: 301
      },
      {
        categoryScores: { [categories.chance]: 21, [categories.fullHouse]: 25 },
        kniffelCount: 0,
        playerId: "you",
        score: 276
      },
      {
        categoryScores: { [categories.chance]: 19, [categories.smallStraight]: 30 },
        kniffelCount: 0,
        playerId: "sara",
        score: 252
      }
    ],
    winnerId: "tom"
  },
  {
    date: "2026-04-22T20:00:00.000Z",
    highlights: ["COMEBACK"],
    id: "game-096",
    results: [
      {
        categoryScores: { [categories.chance]: 26, [categories.fullHouse]: 25 },
        kniffelCount: 0,
        playerId: "you",
        score: 299
      },
      {
        categoryScores: { [categories.chance]: 20, [categories.threeKind]: 17 },
        kniffelCount: 0,
        playerId: "lina",
        score: 271
      }
    ],
    winnerId: "you"
  },
  {
    date: "2026-04-17T18:55:00.000Z",
    highlights: ["CLOSE_GAME"],
    id: "game-095",
    results: [
      {
        categoryScores: { [categories.chance]: 24, [categories.fullHouse]: 25 },
        kniffelCount: 0,
        playerId: "max",
        score: 289
      },
      {
        categoryScores: { [categories.chance]: 25, [categories.smallStraight]: 30 },
        kniffelCount: 0,
        playerId: "you",
        score: 286
      }
    ],
    winnerId: "max"
  },
  {
    date: "2026-04-10T20:25:00.000Z",
    highlights: ["NEW_RECORD", "KNIFFEL"],
    id: "game-094",
    results: [
      {
        categoryScores: { [categories.chance]: 31, [categories.kniffel]: 50, [categories.yahtzeeBonus]: 100 },
        kniffelCount: 2,
        playerId: "you",
        score: 348
      },
      {
        categoryScores: { [categories.chance]: 22, [categories.fullHouse]: 25 },
        kniffelCount: 0,
        playerId: "tom",
        score: 260
      }
    ],
    winnerId: "you"
  },
  {
    date: "2026-04-02T18:30:00.000Z",
    highlights: [],
    id: "game-093",
    results: [
      {
        categoryScores: { [categories.chance]: 21, [categories.fullHouse]: 25 },
        kniffelCount: 0,
        playerId: "sara",
        score: 274
      },
      {
        categoryScores: { [categories.chance]: 19, [categories.threeKind]: 16 },
        kniffelCount: 0,
        playerId: "you",
        score: 239
      }
    ],
    winnerId: "sara"
  },
  {
    date: "2026-03-28T19:15:00.000Z",
    highlights: ["KNIFFEL"],
    id: "game-092",
    results: [
      {
        categoryScores: { [categories.chance]: 22, [categories.kniffel]: 50 },
        kniffelCount: 1,
        playerId: "you",
        score: 305
      },
      {
        categoryScores: { [categories.chance]: 18, [categories.fullHouse]: 25 },
        kniffelCount: 0,
        playerId: "max",
        score: 251
      }
    ],
    winnerId: "you"
  }
];

import type {
  Achievement,
  Friend,
  Game,
  GameHighlight,
  HeadToHeadStats,
  LeaderboardEntry,
  Player,
  PlayerId,
  PlayerStats,
  RivalStats
} from "@/social/types";
import { achievementDefinitions } from "@/social/achievements";
import { scoreCategories, scoreCategoryLabels, upperScoreCategories } from "@/game/scorecard";

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}

function getPlayerResult(game: Game, playerId: PlayerId) {
  return game.results.find((result) => result.playerId === playerId);
}

function getGamesForPlayer(games: Game[], playerId: PlayerId): Game[] {
  return games.filter((game) => getPlayerResult(game, playerId));
}

function calculateWinStreaks(games: Game[], playerId: PlayerId) {
  const newestFirst = [...getGamesForPlayer(games, playerId)].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let current = 0;
  let longest = 0;
  let running = 0;

  newestFirst.forEach((game, index) => {
    const won = game.winnerId === playerId;

    if (index === 0 && won) {
      current = 1;
    } else if (index > 0 && current === index && won) {
      current += 1;
    }

    running = won ? running + 1 : 0;
    longest = Math.max(longest, running);
  });

  return { current, longest };
}

function calculateCategoryStats(games: Game[], playerId: PlayerId) {
  const categoryCounts = new Map<string, number>();
  const categoryPoints = new Map<string, number>();

  getGamesForPlayer(games, playerId).forEach((game) => {
    const result = getPlayerResult(game, playerId);

    if (!result) {
      return;
    }

    Object.entries(result.categoryScores).forEach(([category, points]) => {
      if (points <= 0) {
        return;
      }

      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      categoryPoints.set(category, (categoryPoints.get(category) ?? 0) + points);
    });
  });

  const favoriteCategory =
    [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Noch offen";
  const bestCategory =
    [...categoryPoints.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Noch offen";

  return { bestCategory, favoriteCategory };
}

const upperScoreLabels = upperScoreCategories.map((category) => scoreCategoryLabels[category]);

function getUpperScoreFromResult(result: {
  categoryScores: Record<string, number>;
  upperScore?: number;
}): number {
  if (typeof result.upperScore === "number") {
    return result.upperScore;
  }

  return upperScoreLabels.reduce((sum, label) => sum + (result.categoryScores[label] ?? 0), 0);
}

function hasAllCategoriesStruck(result: {
  categoryScores: Record<string, number>;
  struckCategoryCount?: number;
}): boolean {
  if ((result.struckCategoryCount ?? 0) >= scoreCategories.length) {
    return true;
  }

  return scoreCategories.every((category) => {
    const label = scoreCategoryLabels[category];

    return Object.prototype.hasOwnProperty.call(result.categoryScores, label) &&
      result.categoryScores[label] === 0;
  });
}

export function calculatePlayerStats(games: Game[], playerId: PlayerId): PlayerStats {
  const playerGames = getGamesForPlayer(games, playerId);
  const results = playerGames.flatMap((game) => {
    const result = getPlayerResult(game, playerId);

    return result ? [result] : [];
  });
  const gamesPlayed = playerGames.length;
  const gamesWon = playerGames.filter((game) => game.winnerId === playerId).length;
  const totalPoints = results.reduce((sum, result) => sum + result.score, 0);
  const totalKniffel = results.reduce((sum, result) => sum + result.kniffelCount, 0);
  const bestGameKniffel = Math.max(0, ...results.map((result) => result.kniffelCount));
  const fullHouseCount = results.filter(
    (result) => (result.categoryScores["Full House"] ?? 0) > 0
  ).length;
  const straightBuilderGames = results.filter(
    (result) =>
      (result.categoryScores["Kleine Strasse"] ?? 0) > 0 &&
      (result.categoryScores["Grosse Strasse"] ?? 0) > 0
  ).length;
  const { current, longest } = calculateWinStreaks(games, playerId);
  const { bestCategory, favoriteCategory } = calculateCategoryStats(games, playerId);

  return {
    averagePoints: gamesPlayed > 0 ? round(totalPoints / gamesPlayed, 1) : 0,
    bestCategory,
    bestGameKniffel,
    currentWinStreak: current,
    doubleKniffelGames: results.filter((result) => result.kniffelCount >= 2).length,
    exactScore111Games: results.filter((result) => result.score === 111).length,
    exactScore222Games: results.filter((result) => result.score === 222).length,
    exactScore333Games: results.filter((result) => result.score === 333).length,
    exactScore375Games: results.filter((result) => result.score === 375).length,
    exactUpper67Games: results.filter((result) => getUpperScoreFromResult(result) === 67).length,
    exactUpper69Games: results.filter((result) => getUpperScoreFromResult(result) === 69).length,
    favoriteCategory,
    fullHouseCount,
    gamesPlayed,
    gamesWon,
    highestScore: Math.max(0, ...results.map((result) => result.score)),
    kniffelPerGame: gamesPlayed > 0 ? round(totalKniffel / gamesPlayed, 2) : 0,
    longestWinStreak: longest,
    lowScoreUnder150Games: results.filter((result) => result.score < 150).length,
    perfectUpperBonusGames: results.filter((result) => (result.upperBonus ?? 0) >= 35).length,
    score330Games: results.filter((result) => result.score >= 330).length,
    straightBuilderGames,
    allCategoriesStruckGames: results.filter(hasAllCategoriesStruck).length,
    tripleKniffelGames: results.filter((result) => result.kniffelCount >= 3).length,
    totalKniffel,
    totalPoints,
    winRate: gamesPlayed > 0 ? round((gamesWon / gamesPlayed) * 100) : 0
  };
}

export function calculateLeaderboard(players: Player[], games: Game[]): LeaderboardEntry[] {
  return players
    .map((player) => {
      const stats = calculatePlayerStats(games, player.id);

      return {
        averagePoints: stats.averagePoints,
        player,
        rank: 0,
        totalKniffel: stats.totalKniffel,
        wins: stats.gamesWon
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (b.averagePoints !== a.averagePoints) {
        return b.averagePoints - a.averagePoints;
      }

      return b.totalKniffel - a.totalKniffel;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function getHeadToHeadGames(games: Game[], userId: PlayerId, friendId: PlayerId): Game[] {
  return games.filter((game) => getPlayerResult(game, userId) && getPlayerResult(game, friendId));
}

function calculateRecentWinRun(games: Game[], playerId: PlayerId): number {
  const newestFirst = [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;

  for (const game of newestFirst) {
    if (game.winnerId !== playerId) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function calculateHeadToHeadStats(
  games: Game[],
  user: Player,
  friend: Player
): HeadToHeadStats {
  const directGames = getHeadToHeadGames(games, user.id, friend.id);
  const userResults = directGames.flatMap((game) => {
    const result = getPlayerResult(game, user.id);

    return result ? [result] : [];
  });
  const friendResults = directGames.flatMap((game) => {
    const result = getPlayerResult(game, friend.id);

    return result ? [result] : [];
  });
  const userWins = directGames.filter((game) => game.winnerId === user.id).length;
  const friendWins = directGames.filter((game) => game.winnerId === friend.id).length;
  const lastGame = [...directGames].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  const userWinRun = calculateRecentWinRun(directGames, user.id);
  const friendWinRun = calculateRecentWinRun(directGames, friend.id);
  const gap = Math.abs(userWins - friendWins);

  let insight = "Ihr seid fast gleich stark";

  if (userWinRun >= 3) {
    insight = "Du hast die letzten 3 Spiele gewonnen";
  } else if (friendWinRun >= 3) {
    insight = `${friend.name} hat die letzten 3 Spiele gewonnen`;
  } else if (userWins > friendWins && gap <= 1) {
    insight = "Du fuehrst knapp";
  } else if (userWins > friendWins) {
    insight = `Du fuehrst gegen ${friend.name}`;
  } else if (friendWins > userWins && gap <= 1) {
    insight = `${friend.name} fuehrt knapp`;
  } else if (friendWins > userWins) {
    insight = `${friend.name} fuehrt`;
  }

  return {
    averagePoints: {
      friend: friendResults.length
        ? round(friendResults.reduce((sum, result) => sum + result.score, 0) / friendResults.length, 1)
        : 0,
      user: userResults.length
        ? round(userResults.reduce((sum, result) => sum + result.score, 0) / userResults.length, 1)
        : 0
    },
    directMatches: directGames.length,
    highestScore: {
      friend: Math.max(0, ...friendResults.map((result) => result.score)),
      user: Math.max(0, ...userResults.map((result) => result.score))
    },
    insight,
    kniffel: {
      friend: friendResults.reduce((sum, result) => sum + result.kniffelCount, 0),
      user: userResults.reduce((sum, result) => sum + result.kniffelCount, 0)
    },
    lastWinner:
      lastGame?.winnerId === user.id ? user : lastGame?.winnerId === friend.id ? friend : undefined,
    wins: {
      friend: friendWins,
      user: userWins
    }
  };
}

export function calculateRivalStats(games: Game[], user: Player, friends: Friend[]): RivalStats {
  const directStats = friends.map((friend) => ({
    friend,
    stats: calculateHeadToHeadStats(games, user, friend)
  }));

  return {
    closestRival: directStats
      .filter(({ stats }) => stats.directMatches > 0)
      .sort(
        (a, b) =>
          Math.abs(a.stats.wins.user - a.stats.wins.friend) -
          Math.abs(b.stats.wins.user - b.stats.wins.friend)
      )[0]?.friend,
    mostBeatenFriend: directStats
      .filter(({ stats }) => stats.wins.user > 0)
      .sort((a, b) => b.stats.wins.user - a.stats.wins.user)[0]?.friend,
    nemesis: directStats
      .filter(({ stats }) => stats.wins.friend > 0)
      .sort((a, b) => b.stats.wins.friend - a.stats.wins.friend)[0]?.friend
  };
}

export function calculateAchievements(stats: PlayerStats): Achievement[] {
  return achievementDefinitions.map((definition) => {
    const value = definition.getValue(stats);

    return {
      ...definition,
      earned: value >= definition.target,
      progress: Math.min(value, definition.target)
    };
  });
}

export function getRecentGames(games: Game[], limit = 5): Game[] {
  return [...games]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function getHighlightLabel(highlight: GameHighlight): string {
  const labels: Record<GameHighlight, string> = {
    CLOSE_GAME: "Knappes Spiel",
    COMEBACK: "Comeback-Sieg",
    KNIFFEL: "Kniffel gewuerfelt",
    NEW_RECORD: "Neuer Rekord"
  };

  return labels[highlight];
}

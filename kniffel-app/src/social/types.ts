export type PlayerId = string;

export type Player = {
  avatarUrl?: string;
  color: string;
  id: PlayerId;
  initials: string;
  name: string;
};

export type FriendStatus = "accepted" | "incoming" | "outgoing";

export type Friend = Player & {
  favoriteCategory: string;
  lastActiveAt: string;
  relationshipStatus: FriendStatus;
};

export type GameHighlight =
  | "KNIFFEL"
  | "NEW_RECORD"
  | "CLOSE_GAME"
  | "COMEBACK";

export type PlayerGameResult = {
  categoryScores: Record<string, number>;
  kniffelCount: number;
  playerId: PlayerId;
  score: number;
};

export type Game = {
  date: string;
  highlights: GameHighlight[];
  id: string;
  results: PlayerGameResult[];
  winnerId: PlayerId;
};

export type Match = Game & {
  directOpponentIds: PlayerId[];
};

export type RivalStats = {
  closestRival?: Player;
  mostBeatenFriend?: Player;
  nemesis?: Player;
};

export type PlayerStats = {
  averagePoints: number;
  bestCategory: string;
  currentWinStreak: number;
  favoriteCategory: string;
  gamesPlayed: number;
  gamesWon: number;
  highestScore: number;
  kniffelPerGame: number;
  longestWinStreak: number;
  totalKniffel: number;
  totalPoints: number;
  winRate: number;
};

export type FriendStats = PlayerStats & {
  friendId: PlayerId;
  lastActiveAt: string;
};

export type HeadToHeadStats = {
  averagePoints: {
    friend: number;
    user: number;
  };
  directMatches: number;
  highestScore: {
    friend: number;
    user: number;
  };
  insight: string;
  kniffel: {
    friend: number;
    user: number;
  };
  lastWinner?: Player;
  wins: {
    friend: number;
    user: number;
  };
};

export type AchievementRarity = "common" | "rare" | "epic";

export type Achievement = {
  description: string;
  earned: boolean;
  id: string;
  label: string;
  progress: number;
  rarity: AchievementRarity;
  target: number;
};

export type LeaderboardEntry = {
  averagePoints: number;
  player: Player;
  rank: number;
  totalKniffel: number;
  wins: number;
};

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/session";
import {
  calculateTotalScore,
  scoreCategories,
  scoreCategoryLabels
} from "@/game/scorecard";
import type { Friend, Game, GameHighlight, PlayerGameResult } from "@/social/types";

const ONLINE_THRESHOLD_MS = 30_000;

export type SocialFriendRequest = {
  createdAt: string;
  id: string;
  username: string;
};

export type SocialState = {
  friends: Friend[];
  games: Game[];
  incomingRequests: SocialFriendRequest[];
  outgoingRequests: SocialFriendRequest[];
};

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function colorForId(id: string): string {
  const colors = [
    "bg-emerald-600 text-white",
    "bg-amber-500 text-white",
    "bg-sky-600 text-white",
    "bg-rose-600 text-white",
    "bg-felt text-white"
  ];
  const charSum = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return colors[charSum % colors.length] ?? colors[0];
}

function isOnline(lastSeenAt: Date | null): boolean {
  return Boolean(lastSeenAt && Date.now() - lastSeenAt.getTime() <= ONLINE_THRESHOLD_MS);
}

function toFriend(user: {
  id: string;
  lastSeenAt: Date | null;
  updatedAt: Date;
  username: string;
}): Friend {
  return {
    color: colorForId(user.id),
    favoriteCategory: "Offen",
    id: user.id,
    initials: initials(user.username),
    isOnline: isOnline(user.lastSeenAt),
    lastActiveAt: (user.lastSeenAt ?? user.updatedAt).toISOString(),
    lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    name: user.username,
    relationshipStatus: "accepted"
  };
}

function getKniffelCount(scoreCard: { kniffel: number | null }): number {
  return scoreCard.kniffel && scoreCard.kniffel > 0 ? 1 : 0;
}

function getCategoryScores(
  scoreCard: Partial<Record<(typeof scoreCategories)[number], number | null>>
): Record<string, number> {
  return Object.fromEntries(
    scoreCategories.map((category) => [
      scoreCategoryLabels[category],
      scoreCard[category] ?? 0
    ])
  );
}

function getHighlights(results: PlayerGameResult[]): GameHighlight[] {
  const sortedScores = results.map((result) => result.score).sort((a, b) => b - a);
  const highlights: GameHighlight[] = [];

  if (results.some((result) => result.kniffelCount > 0)) {
    highlights.push("KNIFFEL");
  }

  if (sortedScores.length >= 2 && sortedScores[0] - sortedScores[1] <= 10) {
    highlights.push("CLOSE_GAME");
  }

  return highlights;
}

async function getFinishedSocialGames(userIds: string[]): Promise<Game[]> {
  if (userIds.length === 0) {
    return [];
  }

  const games = await prisma.game.findMany({
    include: {
      players: {
        orderBy: {
          position: "asc"
        },
        select: {
          id: true,
          position: true,
          userId: true
        }
      },
      scoreCards: true
    },
    orderBy: {
      updatedAt: "desc"
    },
    where: {
      players: {
        some: {
          userId: {
            in: userIds
          }
        }
      },
      status: "FINISHED"
    }
  });

  return games.flatMap((game) => {
    const results = game.scoreCards.flatMap((scoreCard) => {
      const player = game.players.find((entry) => entry.id === scoreCard.playerId);

      if (!player?.userId) {
        return [];
      }

      return [
        {
          categoryScores: getCategoryScores(scoreCard),
          kniffelCount: getKniffelCount(scoreCard),
          playerId: player.userId,
          score: scoreCard.total ?? calculateTotalScore(scoreCard)
        }
      ];
    });

    if (results.length === 0) {
      return [];
    }

    const winner = [...results].sort((left, right) => right.score - left.score)[0];

    return [
      {
        date: game.updatedAt.toISOString(),
        highlights: getHighlights(results),
        id: game.id,
        results,
        winnerId: winner.playerId
      }
    ];
  });
}

export async function getSocialState(): Promise<SocialState> {
  const user = await requireCurrentUser();

  const [friendships, incomingRequests, outgoingRequests] = await Promise.all([
    prisma.friendship.findMany({
      include: {
        friend: {
          select: {
            id: true,
            lastSeenAt: true,
            updatedAt: true,
            username: true
          }
        },
        user: {
          select: {
            id: true,
            lastSeenAt: true,
            updatedAt: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      where: {
        OR: [{ userId: user.id }, { friendId: user.id }]
      }
    }),
    prisma.friendRequest.findMany({
      include: {
        sender: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      where: {
        receiverId: user.id
      }
    }),
    prisma.friendRequest.findMany({
      include: {
        receiver: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      where: {
        senderId: user.id
      }
    })
  ]);

  const friends = [
    ...new Map(
      friendships.map((friendship) => {
        const friend = friendship.userId === user.id ? friendship.friend : friendship.user;

        return [friend.id, toFriend(friend)];
      })
    ).values()
  ].sort((left, right) => {
    if (left.isOnline !== right.isOnline) {
      return left.isOnline ? -1 : 1;
    }

    return new Date(right.lastActiveAt).getTime() - new Date(left.lastActiveAt).getTime();
  });
  const games = await getFinishedSocialGames([user.id, ...friends.map((friend) => friend.id)]);

  return {
    friends,
    games,
    incomingRequests: incomingRequests.map((request) => ({
      createdAt: request.createdAt.toISOString(),
      id: request.id,
      username: request.sender.username
    })),
    outgoingRequests: outgoingRequests.map((request) => ({
      createdAt: request.createdAt.toISOString(),
      id: request.id,
      username: request.receiver.username
    }))
  };
}

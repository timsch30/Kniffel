import { scoreCategories } from "@/game/scorecard";
import type { GameInviteFriend, GameState } from "@/game/state";
import { prisma } from "@/lib/prisma";

function normalizeDiceValues(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= 6);
}

async function getFriendInvites(gameId: string, currentUserId: string): Promise<GameInviteFriend[]> {
  const friendships = await prisma.friendship.findMany({
    include: {
      friend: {
        select: {
          id: true,
          username: true
        }
      },
      user: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    where: {
      OR: [{ userId: currentUserId }, { friendId: currentUserId }]
    }
  });
  const friends = friendships.map((friendship) =>
    friendship.userId === currentUserId ? friendship.friend : friendship.user
  );

  if (friends.length === 0) {
    return [];
  }

  const [players, invitations] = await Promise.all([
    prisma.gamePlayer.findMany({
      select: {
        userId: true
      },
      where: {
        gameId,
        userId: {
          in: friends.map((friend) => friend.id)
        }
      }
    }),
    prisma.gameInvitation.findMany({
      select: {
        id: true,
        receiverId: true,
        status: true
      },
      where: {
        gameId,
        receiverId: {
          in: friends.map((friend) => friend.id)
        }
      }
    })
  ]);
  const playerUserIds = new Set(players.flatMap((player) => (player.userId ? [player.userId] : [])));
  const invitationByReceiverId = new Map(
    invitations.map((invitation) => [invitation.receiverId, invitation])
  );

  return friends.map((friend) => {
    const invitation = invitationByReceiverId.get(friend.id);

    return {
      id: friend.id,
      invitationId: invitation?.id ?? null,
      status: playerUserIds.has(friend.id) ? "IN_GAME" : invitation?.status ?? null,
      username: friend.username
    };
  });
}

export async function getGameState(
  gameId: string,
  currentUserId: string
): Promise<GameState | null> {
  const game = await prisma.game.findUnique({
    include: {
      players: {
        orderBy: {
          position: "asc"
        },
        select: {
          displayName: true,
          id: true,
          position: true,
          userId: true
        }
      },
      scoreCards: {
        select: {
          chance: true,
          fives: true,
          fourOfAKind: true,
          fours: true,
          fullHouse: true,
          id: true,
          kniffel: true,
          largeStraight: true,
          ones: true,
          playerId: true,
          sixes: true,
          smallStraight: true,
          threeOfAKind: true,
          threes: true,
          total: true,
          twos: true,
          upperBonus: true
        }
      },
      turns: {
        orderBy: {
          createdAt: "desc"
        },
        select: {
          createdAt: true,
          diceValues: true,
          player: {
            select: {
              displayName: true
            }
          }
        },
        take: 1
      }
    },
    where: {
      id: gameId
    }
  });

  if (!game) {
    return null;
  }

  const scoreCards = game.scoreCards.map((scoreCard) => {
    const normalizedScoreCard = Object.fromEntries(
      scoreCategories.map((category) => [category, scoreCard[category] ?? null])
    ) as Record<(typeof scoreCategories)[number], number | null>;

    return {
      ...normalizedScoreCard,
      id: scoreCard.id,
      playerId: scoreCard.playerId,
      total: scoreCard.total,
      upperBonus: scoreCard.upperBonus
    };
  });
  const currentPlayer = game.players.find((player) => player.id === game.currentPlayerId);
  const ranking = game.players
    .map((player) => {
      const scoreCard = scoreCards.find((card) => card.playerId === player.id);

      return {
        displayName: player.displayName,
        isCurrentPlayer: player.id === game.currentPlayerId,
        playerId: player.id,
        position: player.position,
        total: scoreCard?.total ?? 0
      };
    })
    .sort((a, b) => b.total - a.total || a.position - b.position)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  const winner =
    game.status === "FINISHED" && ranking[0]
      ? {
          displayName: ranking[0].displayName,
          playerId: ranking[0].playerId,
          total: ranking[0].total
        }
      : null;
  const lastTurn = game.turns[0] ?? null;
  const lastAction = lastTurn
    ? {
        createdAt: lastTurn.createdAt.toISOString(),
        diceValues: normalizeDiceValues(lastTurn.diceValues),
        displayName: lastTurn.player?.displayName ?? "Unbekannter Spieler"
      }
    : null;
  const friendInvites =
    game.ownerId === currentUserId && game.status !== "FINISHED"
      ? await getFriendInvites(game.id, currentUserId)
      : [];

  return {
    currentPlayerId: game.currentPlayerId,
    currentPlayerName: currentPlayer?.displayName ?? null,
    friendInvites,
    gameId: game.id,
    inviteCode: game.inviteCode,
    lastAction,
    name: game.name,
    ownerId: game.ownerId,
    players: game.players,
    ranking,
    roundNumber: game.roundNumber,
    scoreCards,
    status: game.status,
    winner
  };
}

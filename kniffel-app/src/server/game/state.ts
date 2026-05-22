import { isScoreCategory, normalizeStruckCategories, scoreCategories } from "@/game/scorecard";
import type { GameInviteFriend, GameState, GameStateEntryMode, GameStateLastEntry } from "@/game/state";
import { prisma } from "@/lib/prisma";
import { expireInactiveActiveGame, isActiveGameExpired } from "@/server/game/expiration";

function normalizeDiceValues(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= 6);
}

function normalizeHeldDice(value: unknown): boolean[] {
  if (!Array.isArray(value)) {
    return [false, false, false, false, false];
  }

  return Array.from({ length: 5 }, (_, index) => value[index] === true);
}

function normalizeEntryMode(value: string | null): GameStateEntryMode {
  return value === "manual" || value === "online" || value === "real" ? value : "real";
}

function isCompleteScoreCard(
  scoreCard: Partial<Record<(typeof scoreCategories)[number], number | null>>
): boolean {
  return scoreCategories.every(
    (category) => scoreCard[category] !== null && scoreCard[category] !== undefined
  );
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
    const friendIsPlayer = playerUserIds.has(friend.id);

    return {
      id: friend.id,
      invitationId: invitation?.id ?? null,
      status: friendIsPlayer ? "IN_GAME" : invitation?.status === "PENDING" ? "PENDING" : null,
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
          struckCategories: true,
          threeOfAKind: true,
          threes: true,
          total: true,
          twos: true,
          upperBonus: true
        }
      },
      turns: {
        orderBy: {
          updatedAt: "desc"
        },
        select: {
          createdAt: true,
          diceValues: true,
          entryCategory: true,
          entryMode: true,
          entryPoints: true,
          heldDice: true,
          id: true,
          playerId: true,
          rollCount: true,
          player: {
            select: {
              displayName: true
            }
          },
          status: true,
          updatedAt: true
        },
        take: 80
      }
    },
    where: {
      id: gameId
    }
  });

  if (!game) {
    return null;
  }

  const expired = game.status === "ACTIVE" && isActiveGameExpired(game.updatedAt);

  if (expired) {
    await expireInactiveActiveGame(game.id);
  }

  const stateUpdatedAt = expired ? new Date() : game.updatedAt;
  const scoreCards = game.scoreCards.map((scoreCard) => {
    const normalizedScoreCard = Object.fromEntries(
      scoreCategories.map((category) => [category, scoreCard[category] ?? null])
    ) as Record<(typeof scoreCategories)[number], number | null>;

    return {
      ...normalizedScoreCard,
      id: scoreCard.id,
      playerId: scoreCard.playerId,
      struckCategories: normalizeStruckCategories(scoreCard.struckCategories),
      total: scoreCard.total,
      upperBonus: scoreCard.upperBonus
    };
  });
  const status = expired ? "FINISHED" : game.status;
  const currentPlayerId = expired ? null : game.currentPlayerId;
  const currentPlayer = game.players.find((player) => player.id === currentPlayerId);
  const ranking = game.players
    .map((player) => {
      const scoreCard = scoreCards.find((card) => card.playerId === player.id);

      return {
        displayName: player.displayName,
        isCurrentPlayer: player.id === currentPlayerId,
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
    status === "FINISHED" && scoreCards.every(isCompleteScoreCard) && ranking[0]
      ? {
          displayName: ranking[0].displayName,
          playerId: ranking[0].playerId,
          total: ranking[0].total
        }
      : null;
  const lastTurn = game.turns[0] ?? null;
  const activeTurnSource = game.turns.find(
    (turn) => turn.status === "ACTIVE" && turn.playerId === currentPlayerId
  );
  const activeTurn =
    status === "ACTIVE" && activeTurnSource?.playerId
      ? {
          diceValues: normalizeDiceValues(activeTurnSource.diceValues),
          heldDice: normalizeHeldDice(activeTurnSource.heldDice),
          id: activeTurnSource.id,
          playerId: activeTurnSource.playerId,
          rollCount: activeTurnSource.rollCount,
          updatedAt: activeTurnSource.updatedAt.toISOString()
        }
      : null;
  const finishedEntries = game.turns.flatMap((turn): GameStateLastEntry[] => {
    if (
      turn.status !== "FINISHED" ||
      !turn.playerId ||
      !turn.entryCategory ||
      !isScoreCategory(turn.entryCategory) ||
      typeof turn.entryPoints !== "number"
    ) {
      return [];
    }

    return [
      {
        category: turn.entryCategory,
        createdAt: turn.updatedAt.toISOString(),
        diceValues: normalizeDiceValues(turn.diceValues),
        displayName: turn.player?.displayName ?? "Unbekannter Spieler",
        entryMode: normalizeEntryMode(turn.entryMode),
        id: turn.id,
        playerId: turn.playerId,
        points: turn.entryPoints
      }
    ];
  });
  const latestEntry = finishedEntries[0] ?? null;
  const entriesByPlayerId = new Map<string, GameStateLastEntry>();

  finishedEntries.forEach((entry) => {
    if (!entriesByPlayerId.has(entry.playerId)) {
      entriesByPlayerId.set(entry.playerId, entry);
    }
  });

  const lastAction = lastTurn
    ? {
        createdAt: lastTurn.createdAt.toISOString(),
        diceValues: normalizeDiceValues(lastTurn.diceValues),
        displayName: lastTurn.player?.displayName ?? "Unbekannter Spieler"
      }
    : null;
  const currentUserIsPlayer = game.players.some((player) => player.userId === currentUserId);
  const friendInvites =
    currentUserIsPlayer && status === "LOBBY"
      ? await getFriendInvites(game.id, currentUserId)
      : [];

  return {
    activeTurn,
    currentPlayerId,
    currentPlayerName: currentPlayer?.displayName ?? null,
    friendInvites,
    gameId: game.id,
    inviteCode: game.inviteCode,
    lastAction,
    lastEntries: [...entriesByPlayerId.values()],
    latestEntry,
    name: game.name,
    ownerId: game.ownerId,
    players: game.players,
    ranking,
    roundNumber: game.roundNumber,
    scoreCards,
    status,
    updatedAt: stateUpdatedAt.toISOString(),
    winner
  };
}

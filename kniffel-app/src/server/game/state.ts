import { scoreCategories } from "@/game/scorecard";
import type { GameState } from "@/game/state";
import { prisma } from "@/lib/prisma";

function normalizeDiceValues(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= 6);
}

export async function getGameState(gameId: string): Promise<GameState | null> {
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

  return {
    currentPlayerId: game.currentPlayerId,
    currentPlayerName: currentPlayer?.displayName ?? null,
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

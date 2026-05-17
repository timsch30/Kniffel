import { prisma } from "@/lib/prisma";

const ACTIVE_GAME_EXPIRATION_MS = 48 * 60 * 60 * 1000;

export function isActiveGameExpired(updatedAt: Date): boolean {
  return updatedAt.getTime() < Date.now() - ACTIVE_GAME_EXPIRATION_MS;
}

export async function expireInactiveActiveGames(): Promise<void> {
  const expiresBefore = new Date(Date.now() - ACTIVE_GAME_EXPIRATION_MS);

  await prisma.game.updateMany({
    data: {
      currentPlayerId: null,
      status: "FINISHED"
    },
    where: {
      status: "ACTIVE",
      updatedAt: {
        lt: expiresBefore
      }
    }
  });
}

export async function expireInactiveActiveGame(gameId: string): Promise<void> {
  await prisma.game.updateMany({
    data: {
      currentPlayerId: null,
      status: "FINISHED"
    },
    where: {
      id: gameId,
      status: "ACTIVE",
      updatedAt: {
        lt: new Date(Date.now() - ACTIVE_GAME_EXPIRATION_MS)
      }
    }
  });
}

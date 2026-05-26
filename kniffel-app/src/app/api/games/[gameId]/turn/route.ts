import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type TurnRouteProps = {
  params: Promise<{
    gameId: string;
  }>;
};

function normalizeDiceValues(value: unknown): number[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  if (value.length !== 0 && value.length !== 5) {
    return null;
  }

  const diceValues = value.map((entry) => Number(entry));

  if (!diceValues.every((entry) => Number.isInteger(entry) && entry >= 1 && entry <= 6)) {
    return null;
  }

  return diceValues;
}

function normalizeHeldDice(value: unknown): boolean[] | null {
  if (!Array.isArray(value) || value.length !== 5) {
    return null;
  }

  if (!value.every((entry) => typeof entry === "boolean")) {
    return null;
  }

  return value;
}

function normalizeRollCount(value: unknown): number | null {
  const rollCount = Number(value);

  if (!Number.isInteger(rollCount) || rollCount < 0 || rollCount > 3) {
    return null;
  }

  return rollCount;
}

export async function POST(request: Request, { params }: TurnRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const { gameId } = await params;
  const body = (await request.json().catch(() => null)) as unknown;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const diceValues = normalizeDiceValues(payload.diceValues);
  const heldDice = normalizeHeldDice(payload.heldDice);
  const rollCount = normalizeRollCount(payload.rollCount);

  if (!diceValues || !heldDice || rollCount === null) {
    return NextResponse.json({ error: "Wurfstand ist ungueltig." }, { status: 400 });
  }

  const game = await prisma.game.findUnique({
    include: {
      players: {
        orderBy: {
          position: "asc"
        },
        select: {
          id: true,
          userId: true
        }
      }
    },
    where: {
      id: gameId
    }
  });

  if (!game || game.status !== "ACTIVE") {
    return NextResponse.json({ error: "Runde ist nicht aktiv." }, { status: 404 });
  }

  const currentPlayer = game.players.find((player) => player.id === game.currentPlayerId);

  if (!currentPlayer) {
    return NextResponse.json({ error: "Aktueller Spieler fehlt." }, { status: 409 });
  }

  if (
    currentPlayer.userId !== user.id &&
    (currentPlayer.userId !== null || game.ownerId !== user.id)
  ) {
    return NextResponse.json({ error: "Du bist nicht am Zug." }, { status: 403 });
  }

  const activeTurn = await prisma.turn.findFirst({
    orderBy: {
      updatedAt: "desc"
    },
    select: {
      id: true
    },
    where: {
      gameId,
      playerId: currentPlayer.id,
      status: "ACTIVE"
    }
  });

  const turn = await prisma.$transaction(async (tx) => {
    const savedTurn = activeTurn
      ? await tx.turn.update({
          data: {
            diceValues,
            heldDice,
            rollCount
          },
          select: {
            id: true,
            updatedAt: true
          },
          where: {
            id: activeTurn.id
          }
        })
      : await tx.turn.create({
          data: {
            diceValues,
            gameId,
            heldDice,
            playerId: currentPlayer.id,
            rollCount,
            status: "ACTIVE"
          },
          select: {
            id: true,
            updatedAt: true
          }
        });

    await tx.game.update({
      data: {
        updatedAt: new Date()
      },
      where: {
        id: gameId
      }
    });

    return savedTurn;
  });

  return NextResponse.json({
    id: turn.id,
    updatedAt: turn.updatedAt.toISOString()
  });
}

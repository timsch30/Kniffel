"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  areAllScoreCardsComplete,
  determineNextPlayer,
  isCategoryFilled,
  isScoreCategory,
  updateScoreCard,
  updateStruckCategories
} from "@/game/scorecard";
import { assertValidDiceValues, calculateScoreForCategory } from "@/game/scoring";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/session";
import { generateUniqueInviteCode } from "@/server/game/invite-code";

const MAX_CREATE_GAME_ATTEMPTS = 5;

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(path: string, error: string): never {
  const separator = path.includes("?") ? "&" : "?";

  redirect(`${path}${separator}error=${encodeURIComponent(error)}`);
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function orderedFriendshipPair(firstUserId: string, secondUserId: string) {
  return firstUserId < secondUserId
    ? { friendId: secondUserId, userId: firstUserId }
    : { friendId: firstUserId, userId: secondUserId };
}

async function addUserToGame(
  tx: Prisma.TransactionClient,
  gameId: string,
  user: { id: string; username: string }
) {
  const players = await tx.gamePlayer.findMany({
    orderBy: {
      position: "asc"
    },
    select: {
      position: true,
      userId: true
    },
    where: {
      gameId
    }
  });

  if (players.some((player) => player.userId === user.id)) {
    return;
  }

  const nextPosition =
    players.reduce((highestPosition, player) => Math.max(highestPosition, player.position), 0) + 1;

  const gamePlayer = await tx.gamePlayer.create({
    data: {
      displayName: user.username,
      gameId,
      position: nextPosition,
      userId: user.id
    },
    select: {
      id: true
    }
  });

  await tx.scoreCard.create({
    data: {
      gameId,
      playerId: gamePlayer.id
    }
  });
}

export async function createGameAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const name = readString(formData, "name");

  if (name.length < 3) {
    redirectWithError("/games/new", "Rundenname muss mindestens 3 Zeichen lang sein.");
  }

  if (name.length > 50) {
    redirectWithError("/games/new", "Rundenname darf maximal 50 Zeichen lang sein.");
  }

  for (let attempt = 0; attempt < MAX_CREATE_GAME_ATTEMPTS; attempt += 1) {
    let gameId: string | null = null;

    try {
      const game = await prisma.$transaction(async (tx) => {
        const createdGame = await tx.game.create({
          data: {
            inviteCode: await generateUniqueInviteCode(tx),
            name,
            ownerId: user.id
          },
          select: {
            id: true
          }
        });

        const gamePlayer = await tx.gamePlayer.create({
          data: {
            displayName: user.username,
            gameId: createdGame.id,
            position: 1,
            userId: user.id
          },
          select: {
            id: true
          }
        });

        await tx.scoreCard.create({
          data: {
            gameId: createdGame.id,
            playerId: gamePlayer.id
          }
        });

        return createdGame;
      });

      gameId = game.id;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }

      redirectWithError("/games/new", "Runde konnte nicht erstellt werden.");
    }

    if (gameId) {
      redirect(`/games/${gameId}`);
    }
  }

  redirectWithError("/games/new", "Invite-Code konnte nicht erzeugt werden.");
}

export async function joinGameAction(inviteCode: string): Promise<void> {
  const user = await requireCurrentUser();
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  const joinPath = `/join/${encodeURIComponent(normalizedInviteCode)}`;

  const game = await prisma.game.findUnique({
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
      }
    },
    where: {
      inviteCode: normalizedInviteCode
    }
  });

  if (!game) {
    redirectWithError(joinPath, "Runde wurde nicht gefunden.");
  }

  if (game.status === "FINISHED") {
    redirectWithError(joinPath, "Diese Runde ist bereits beendet.");
  }

  if (game.players.some((player) => player.userId === user.id)) {
    redirect(`/games/${game.id}`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await addUserToGame(tx, game.id, user);
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWithError(joinPath, "Beitritt fehlgeschlagen. Bitte erneut versuchen.");
    }

    redirectWithError(joinPath, "Beitritt fehlgeschlagen.");
  }

  redirect(`/games/${game.id}`);
}

export async function joinByCodeAction(formData: FormData): Promise<void> {
  const inviteCode = readString(formData, "inviteCode").toUpperCase();

  if (!inviteCode) {
    redirectWithError("/join", "Invite-Code fehlt.");
  }

  redirect(`/join/${encodeURIComponent(inviteCode)}`);
}

export async function inviteFriendToGameAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const gameId = readString(formData, "gameId");
  const friendId = readString(formData, "friendId");
  const errorPath = `/games/${gameId}`;

  if (!gameId || !friendId) {
    redirectWithError(errorPath, "Einladung ist unvollstaendig.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        include: {
          players: {
            select: {
              userId: true
            }
          }
        },
        where: {
          id: gameId
        }
      });

      if (!game) {
        throw new Error("Runde wurde nicht gefunden.");
      }

      if (game.ownerId !== user.id) {
        throw new Error("Nur der Owner kann Freunde einladen.");
      }

      if (game.status === "FINISHED") {
        throw new Error("Diese Runde ist bereits beendet.");
      }

      if (game.players.some((player) => player.userId === friendId)) {
        throw new Error("Dieser Freund ist bereits in der Runde.");
      }

      const friendship = await tx.friendship.findUnique({
        where: {
          userId_friendId: orderedFriendshipPair(user.id, friendId)
        }
      });

      if (!friendship) {
        throw new Error("Du kannst nur bestehende Freunde einladen.");
      }

      await tx.gameInvitation.create({
        data: {
          gameId,
          receiverId: friendId,
          senderId: user.id
        }
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWithError(errorPath, "Dieser Freund wurde bereits eingeladen.");
    }

    const message = error instanceof Error ? error.message : "Einladung konnte nicht gesendet werden.";

    redirectWithError(errorPath, message);
  }

  revalidatePath(errorPath);
  redirect(errorPath);
}

export async function acceptGameInvitationAction(invitationId: string): Promise<void> {
  const user = await requireCurrentUser();
  let gameId: string | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      const invitation = await tx.gameInvitation.findUnique({
        include: {
          game: {
            select: {
              id: true,
              status: true
            }
          }
        },
        where: {
          id: invitationId
        }
      });

      if (!invitation || invitation.receiverId !== user.id) {
        throw new Error("Einladung wurde nicht gefunden.");
      }

      if (invitation.game.status === "FINISHED") {
        throw new Error("Diese Runde ist bereits beendet.");
      }

      gameId = invitation.game.id;
      await addUserToGame(tx, invitation.game.id, user);
      await tx.gameInvitation.update({
        data: {
          status: "ACCEPTED"
        },
        where: {
          id: invitation.id
        }
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Einladung konnte nicht angenommen werden.";

    redirectWithError("/dashboard", message);
  }

  redirect(gameId ? `/games/${gameId}` : "/dashboard");
}

export async function declineGameInvitationAction(invitationId: string): Promise<void> {
  const user = await requireCurrentUser();

  await prisma.gameInvitation.deleteMany({
    where: {
      id: invitationId,
      receiverId: user.id,
      status: "PENDING"
    }
  });

  revalidatePath("/dashboard");
}

function readDiceValues(formData: FormData): number[] {
  const rawDiceValues = readString(formData, "diceValues");

  try {
    const diceValues = JSON.parse(rawDiceValues) as unknown;

    if (!Array.isArray(diceValues)) {
      throw new Error("ungueltig");
    }

    const normalizedDiceValues = diceValues.map((value) => Number(value));

    assertValidDiceValues(normalizedDiceValues);

    return normalizedDiceValues;
  } catch {
    throw new Error("Es muessen genau 5 Augenzahlen zwischen 1 und 6 sein.");
  }
}

function readManualPoints(formData: FormData): number {
  const rawPoints = readString(formData, "points");
  const points = Number(rawPoints);

  if (!Number.isInteger(points) || points < 0 || points > 100) {
    throw new Error("Punkte muessen eine ganze Zahl von 0 bis 100 sein.");
  }

  return points;
}

export async function startGameAction(gameId: string): Promise<void> {
  const user = await requireCurrentUser();
  const errorPath = `/games/${gameId}`;

  const game = await prisma.game.findUnique({
    include: {
      players: {
        orderBy: {
          position: "asc"
        },
        select: {
          id: true
        }
      }
    },
    where: {
      id: gameId
    }
  });

  if (!game) {
    redirectWithError(errorPath, "Runde wurde nicht gefunden.");
  }

  if (game.ownerId !== user.id) {
    redirectWithError(errorPath, "Nur der Owner kann die Runde starten.");
  }

  if (game.status !== "LOBBY") {
    redirectWithError(errorPath, "Diese Runde kann nicht gestartet werden.");
  }

  if (game.players.length < 2) {
    redirectWithError(errorPath, "Zum Starten werden mindestens 2 Spieler benoetigt.");
  }

  await prisma.game.update({
    data: {
      currentPlayerId: game.players[0].id,
      roundNumber: 1,
      status: "ACTIVE"
    },
    where: {
      id: game.id
    }
  });

  redirect(`/games/${game.id}`);
}

export async function movePlayerAction(
  gameId: string,
  playerId: string,
  direction: "up" | "down"
): Promise<void> {
  const user = await requireCurrentUser();
  const errorPath = `/games/${gameId}`;

  try {
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        include: {
          players: {
            orderBy: {
              position: "asc"
            },
            select: {
              id: true,
              position: true
            }
          }
        },
        where: {
          id: gameId
        }
      });

      if (!game) {
        throw new Error("Runde wurde nicht gefunden.");
      }

      if (game.ownerId !== user.id) {
        throw new Error("Nur der Owner kann die Reihenfolge aendern.");
      }

      if (game.status !== "LOBBY") {
        throw new Error("Reihenfolge kann nur in der Lobby geaendert werden.");
      }

      const currentIndex = game.players.findIndex((player) => player.id === playerId);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const currentPlayer = game.players[currentIndex];
      const targetPlayer = game.players[targetIndex];

      if (!currentPlayer || !targetPlayer) {
        return;
      }

      const temporaryPosition =
        game.players.reduce(
          (highestPosition, player) => Math.max(highestPosition, player.position),
          0
        ) + 1000;

      await tx.gamePlayer.update({
        data: {
          position: temporaryPosition
        },
        where: {
          id: currentPlayer.id
        }
      });

      await tx.gamePlayer.update({
        data: {
          position: currentPlayer.position
        },
        where: {
          id: targetPlayer.id
        }
      });

      await tx.gamePlayer.update({
        data: {
          position: targetPlayer.position
        },
        where: {
          id: currentPlayer.id
        }
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reihenfolge konnte nicht geaendert werden.";

    redirectWithError(errorPath, message);
  }

  redirect(errorPath);
}

export async function restartGameAction(gameId: string): Promise<void> {
  const user = await requireCurrentUser();
  const errorPath = `/games/${gameId}`;

  try {
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        include: {
          players: {
            orderBy: {
              position: "asc"
            },
            select: {
              id: true
            }
          }
        },
        where: {
          id: gameId
        }
      });

      if (!game) {
        throw new Error("Runde wurde nicht gefunden.");
      }

      if (game.ownerId !== user.id) {
        throw new Error("Nur der Owner kann die Runde neu starten.");
      }

      if (game.status !== "FINISHED") {
        throw new Error("Nur beendete Runden koennen neu gestartet werden.");
      }

      const firstPlayer = game.players[0];

      if (!firstPlayer) {
        throw new Error("Keine Spieler vorhanden.");
      }

      await tx.scoreCard.updateMany({
        data: {
          chance: null,
          fives: null,
          fourOfAKind: null,
          fours: null,
          fullHouse: null,
          kniffel: null,
          largeStraight: null,
          ones: null,
          sixes: null,
          smallStraight: null,
          struckCategories: [],
          threeOfAKind: null,
          threes: null,
          total: null,
          twos: null,
          upperBonus: null
        },
        where: {
          gameId: game.id
        }
      });

      await tx.turn.deleteMany({
        where: {
          gameId: game.id
        }
      });

      await tx.game.update({
        data: {
          currentPlayerId: firstPlayer.id,
          roundNumber: 1,
          status: "ACTIVE"
        },
        where: {
          id: game.id
        }
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Runde konnte nicht neu gestartet werden.";

    redirectWithError(errorPath, message);
  }

  redirect(errorPath);
}

export async function enterScoreAction(gameId: string, formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const errorPath = `/games/${gameId}`;
  const categoryValue = readString(formData, "category");
  const mode = readString(formData, "mode");
  let diceValues: number[] = [];
  let manualPoints: number | null = null;

  if (!isScoreCategory(categoryValue)) {
    redirectWithError(errorPath, "Ungueltige Kategorie.");
  }

  if (mode !== "dice" && mode !== "manual") {
    redirectWithError(errorPath, "Ungueltiger Eintrag.");
  }

  try {
    if (mode === "dice") {
      diceValues = readDiceValues(formData);
    } else {
      manualPoints = readManualPoints(formData);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eintrag ist ungueltig.";

    redirectWithError(errorPath, message);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
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
        where: {
          id: gameId
        }
      });

      if (!game) {
        throw new Error("Runde wurde nicht gefunden.");
      }

      if (game.status !== "ACTIVE") {
        throw new Error("Runde ist nicht aktiv.");
      }

      const currentPlayer = game.players.find((player) => player.id === game.currentPlayerId);

      if (!currentPlayer) {
        throw new Error("Aktueller Spieler fehlt.");
      }

      if (currentPlayer.userId !== user.id) {
        throw new Error("Du bist nicht am Zug.");
      }

      const scoreCard = game.scoreCards.find((card) => card.playerId === currentPlayer.id);

      if (!scoreCard) {
        throw new Error("ScoreCard fehlt.");
      }

      if (isCategoryFilled(scoreCard, categoryValue)) {
        throw new Error("Kategorie ist bereits belegt.");
      }

      const points =
        mode === "dice" ? calculateScoreForCategory(categoryValue, diceValues) : manualPoints;

      if (points === null) {
        throw new Error("Punkte fehlen.");
      }

      const nextScoreCard = updateScoreCard(scoreCard, categoryValue, points);
      const struckCategories = updateStruckCategories(
        scoreCard.struckCategories,
        categoryValue,
        points === 0
      );

      const updatedScoreCard = await tx.scoreCard.update({
        data: {
          [categoryValue]: points,
          struckCategories,
          total: nextScoreCard.total,
          upperBonus: nextScoreCard.upperBonus
        } as Prisma.ScoreCardUpdateInput,
        where: {
          id: scoreCard.id
        }
      });

      await tx.turn.create({
        data: {
          diceValues: mode === "dice" ? diceValues : [],
          gameId: game.id,
          playerId: currentPlayer.id,
          status: "FINISHED"
        }
      });

      const scoreCardsAfterUpdate = game.scoreCards.map((card) =>
        card.id === updatedScoreCard.id ? updatedScoreCard : card
      );
      const isFinished = areAllScoreCardsComplete(scoreCardsAfterUpdate);

      if (isFinished) {
        await tx.game.update({
          data: {
            currentPlayerId: null,
            status: "FINISHED"
          },
          where: {
            id: game.id
          }
        });

        return;
      }

      const nextTurn = determineNextPlayer(game.players, currentPlayer.id);

      await tx.game.update({
        data: {
          currentPlayerId: nextTurn.nextPlayerId,
          roundNumber: nextTurn.completedRotation ? game.roundNumber + 1 : game.roundNumber
        },
        where: {
          id: game.id
        }
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Punkte konnten nicht gespeichert werden.";

    redirectWithError(errorPath, message);
  }

  revalidatePath(`/games/${gameId}`);
}

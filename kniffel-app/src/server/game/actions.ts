"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  areAllScoreCardsComplete,
  calculateTotalScore,
  calculateUpperBonus,
  determineNextPlayer,
  isCategoryFilled,
  isScoreCategory,
  updateScoreCard,
  updateStruckCategories
} from "@/game/scorecard";
import {
  assertValidDiceValues,
  calculateScoreForCategory,
} from "@/game/scoring";
import { bot_decision } from "@/game/bot";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/session";
import { expireInactiveActiveGame } from "@/server/game/expiration";
import { generateUniqueInviteCode } from "@/server/game/invite-code";

const MAX_CREATE_GAME_ATTEMPTS = 5;
const MAX_PLAYER_DISPLAY_NAME_LENGTH = 30;
const MAX_BOT_COUNT = 4;

function isDebugAdmin(user: { username: string }): boolean {
  return user.username.trim().toLowerCase() === "admin";
}

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function readEntryMode(formData: FormData, mode: string): "manual" | "online" | "real" {
  if (mode === "manual") {
    return "manual";
  }

  const entryMode = readString(formData, "entryMode");

  return entryMode === "online" || entryMode === "real" ? entryMode : "real";
}

function redirectWithError(path: string, error: string): never {
  const separator = path.includes("?") ? "&" : "?";

  redirect(`${path}${separator}error=${encodeURIComponent(error)}`);
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function normalizeDisplayName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function createDefaultGuestName(players: Array<{ displayName: string; userId: string | null }>) {
  const existingNames = new Set(players.map((player) => player.displayName.toLowerCase()));
  let guestNumber = players.filter((player) => player.userId === null).length + 1;

  while (existingNames.has(`spieler ${guestNumber}`)) {
    guestNumber += 1;
  }

  return `Spieler ${guestNumber}`;
}


function createDefaultBotName(players: Array<{ displayName: string }>) {
  const existingNames = new Set(players.map((player) => player.displayName.toLowerCase()));
  let botNumber = 1;

  while (existingNames.has(`bot ${botNumber}`)) {
    botNumber += 1;
  }

  return `Bot ${botNumber}`;
}

function orderedFriendshipPair(firstUserId: string, secondUserId: string) {
  return firstUserId < secondUserId
    ? { friendId: secondUserId, userId: firstUserId }
    : { friendId: firstUserId, userId: secondUserId };
}

async function touchGame(tx: Prisma.TransactionClient, gameId: string) {
  await tx.game.update({
    data: {
      updatedAt: new Date()
    },
    where: {
      id: gameId
    }
  });
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

  await touchGame(tx, gameId);
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

      if (!game.players.some((player) => player.userId === user.id)) {
        throw new Error("Nur Spieler in dieser Runde koennen Freunde einladen.");
      }

      if (game.status !== "LOBBY") {
        throw new Error("Freunde koennen nur in der Lobby eingeladen werden.");
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

      await tx.gameInvitation.upsert({
        create: {
          gameId,
          receiverId: friendId,
          senderId: user.id
        },
        update: {
          senderId: user.id,
          status: "PENDING"
        },
        where: {
          gameId_receiverId: {
            gameId,
            receiverId: friendId
          }
        }
      });

      await touchGame(tx, gameId);
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

export async function addGuestPlayerAction(gameId: string): Promise<void> {
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
              displayName: true,
              position: true,
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
        throw new Error("Nur der Owner kann Gastspieler hinzufuegen.");
      }

      if (game.status !== "LOBBY") {
        throw new Error("Gastspieler koennen nur in der Lobby hinzugefuegt werden.");
      }

      const nextPosition =
        game.players.reduce((highestPosition, player) => Math.max(highestPosition, player.position), 0) +
        1;
      const gamePlayer = await tx.gamePlayer.create({
        data: {
          displayName: createDefaultGuestName(game.players),
          gameId: game.id,
          position: nextPosition
        },
        select: {
          id: true
        }
      });

      await tx.scoreCard.create({
        data: {
          gameId: game.id,
          playerId: gamePlayer.id
        }
      });

      await touchGame(tx, game.id);
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gastspieler konnte nicht hinzugefuegt werden.";

    redirectWithError(errorPath, message);
  }

  revalidatePath(errorPath);
  redirect(errorPath);
}

export async function addBotPlayerAction(gameId: string): Promise<void> {
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
              displayName: true,
              isBot: true,
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
        throw new Error("Nur der Owner kann Bots hinzufuegen.");
      }

      if (game.status !== "LOBBY") {
        throw new Error("Bots koennen nur in der Lobby hinzugefuegt werden.");
      }

      const botCount = game.players.filter((player) => player.isBot).length;

      if (botCount >= MAX_BOT_COUNT) {
        throw new Error(`Es koennen maximal ${MAX_BOT_COUNT} Bots hinzugefuegt werden.`);
      }

      const nextPosition =
        game.players.reduce((highestPosition, player) => Math.max(highestPosition, player.position), 0) +
        1;
      const gamePlayer = await tx.gamePlayer.create({
        data: {
          displayName: createDefaultBotName(game.players),
          gameId: game.id,
          isBot: true,
          position: nextPosition
        },
        select: {
          id: true
        }
      });

      await tx.scoreCard.create({
        data: {
          gameId: game.id,
          playerId: gamePlayer.id
        }
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bot konnte nicht hinzugefuegt werden.";

    redirectWithError(errorPath, message);
  }

  revalidatePath(errorPath);
  redirect(errorPath);
}

export async function renamePlayerAction(
  gameId: string,
  playerId: string,
  formData: FormData
): Promise<void> {
  const user = await requireCurrentUser();
  const errorPath = `/games/${gameId}`;
  const displayName = normalizeDisplayName(readString(formData, "displayName"));

  if (!displayName) {
    redirectWithError(errorPath, "Spielername darf nicht leer sein.");
  }

  if (displayName.length > MAX_PLAYER_DISPLAY_NAME_LENGTH) {
    redirectWithError(
      errorPath,
      `Spielername darf maximal ${MAX_PLAYER_DISPLAY_NAME_LENGTH} Zeichen lang sein.`
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        include: {
          players: {
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
        throw new Error("Nur der Owner kann Spielernamen aendern.");
      }

      if (!game.players.some((player) => player.id === playerId)) {
        throw new Error("Spieler wurde nicht gefunden.");
      }

      await tx.gamePlayer.update({
        data: {
          displayName
        },
        where: {
          id: playerId
        }
      });

      await touchGame(tx, gameId);
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Spielername konnte nicht geaendert werden.";

    redirectWithError(errorPath, message);
  }

  revalidatePath(errorPath);
  redirect(errorPath);
}

export async function removeGuestPlayerAction(gameId: string, playerId: string): Promise<void> {
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
              position: true,
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
        throw new Error("Nur der Owner kann Gastspieler entfernen.");
      }

      if (game.status !== "LOBBY") {
        throw new Error("Gastspieler koennen nur in der Lobby entfernt werden.");
      }

      const player = game.players.find((entry) => entry.id === playerId);

      if (!player) {
        throw new Error("Spieler wurde nicht gefunden.");
      }

      if (player.userId !== null) {
        throw new Error("Nur lokale Spieler (Gast/Bot) koennen entfernt werden.");
      }

      await tx.gamePlayer.delete({
        where: {
          id: player.id
        }
      });

      const remainingPlayers = game.players.filter((entry) => entry.id !== player.id);

      for (const [index, entry] of remainingPlayers.entries()) {
        const position = index + 1;

        if (entry.position === position) {
          continue;
        }

        await tx.gamePlayer.update({
          data: {
            position
          },
          where: {
            id: entry.id
          }
        });
      }

      await touchGame(tx, game.id);
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gastspieler konnte nicht entfernt werden.";

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

export async function deleteGameAction(gameId: string): Promise<void> {
  const user = await requireCurrentUser();

  const game = await prisma.game.findUnique({
    select: {
      ownerId: true
    },
    where: {
      id: gameId
    }
  });

  if (!game) {
    redirectWithError("/dashboard", "Runde wurde nicht gefunden.");
  }

  if (game.ownerId !== user.id) {
    redirectWithError("/dashboard", "Nur eigene Runden koennen geloescht werden.");
  }

  await prisma.game.delete({
    where: {
      id: gameId
    }
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function leaveGameAction(gameId: string): Promise<void> {
  const user = await requireCurrentUser();

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
          }
        },
        where: {
          id: gameId
        }
      });

      if (!game) {
        throw new Error("Runde wurde nicht gefunden.");
      }

      if (game.ownerId === user.id) {
        throw new Error("Eigene Runden bitte loeschen statt verlassen.");
      }

      const player = game.players.find((entry) => entry.userId === user.id);

      if (!player) {
        throw new Error("Du bist nicht in dieser Runde.");
      }

      await tx.gamePlayer.delete({
        where: {
          id: player.id
        }
      });

      const remainingPlayers = game.players.filter((entry) => entry.id !== player.id);
      const currentPlayerLeft = game.currentPlayerId === player.id;
      const nextCurrentPlayer = currentPlayerLeft
        ? remainingPlayers.find((entry) => entry.position > player.position) ?? remainingPlayers[0] ?? null
        : null;

      await Promise.all(
        remainingPlayers.map((entry, index) =>
          tx.gamePlayer.update({
            data: {
              position: index + 1
            },
            where: {
              id: entry.id
            }
          })
        )
      );

      if (currentPlayerLeft) {
        await tx.game.update({
          data: {
            currentPlayerId: nextCurrentPlayer?.id ?? null
          },
          where: {
            id: game.id
          }
        });
      } else {
        await touchGame(tx, game.id);
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Runde konnte nicht verlassen werden.";

    redirectWithError("/dashboard", message);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
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

function readPlayerOrder(formData: FormData | undefined): string[] {
  if (!formData) {
    return [];
  }

  const rawOrder = readString(formData, "playerOrder");

  if (!rawOrder) {
    return [];
  }

  try {
    const playerOrder = JSON.parse(rawOrder) as unknown;

    if (!Array.isArray(playerOrder)) {
      return [];
    }

    return playerOrder.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  } catch {
    return [];
  }
}

async function applyPlayerOrder(
  tx: Prisma.TransactionClient,
  players: Array<{ id: string; position: number }>,
  playerOrder: string[]
) {
  if (playerOrder.length === 0) {
    return players;
  }

  const playerIds = new Set(players.map((player) => player.id));
  const orderedIds = new Set(playerOrder);

  if (playerOrder.length !== players.length || orderedIds.size !== players.length) {
    throw new Error("Spielerreihenfolge ist ungueltig.");
  }

  if (playerOrder.some((playerId) => !playerIds.has(playerId))) {
    throw new Error("Spielerreihenfolge ist ungueltig.");
  }

  const playersById = new Map(players.map((player) => [player.id, player]));
  const nextPlayers = playerOrder.map((playerId, index) => ({
    ...playersById.get(playerId)!,
    position: index + 1
  }));

  for (const [index, player] of nextPlayers.entries()) {
    await tx.gamePlayer.update({
      data: {
        position: index + 1000
      },
      where: {
        id: player.id
      }
    });
  }

  for (const player of nextPlayers) {
    await tx.gamePlayer.update({
      data: {
        position: player.position
      },
      where: {
        id: player.id
      }
    });
  }

  return nextPlayers;
}

export async function startGameAction(gameId: string, formData?: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const errorPath = `/games/${gameId}`;

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

  const guestNames = new Map<string, string>();
  const playerOrder = readPlayerOrder(formData);

  if (formData) {
    for (const player of game.players) {
      if (player.userId !== null) {
        continue;
      }

      const displayName = normalizeDisplayName(readString(formData, `playerName:${player.id}`));

      if (!displayName) {
        redirectWithError(errorPath, "Gastspielername darf nicht leer sein.");
      }

      if (displayName.length > MAX_PLAYER_DISPLAY_NAME_LENGTH) {
        redirectWithError(
          errorPath,
          `Gastspielername darf maximal ${MAX_PLAYER_DISPLAY_NAME_LENGTH} Zeichen lang sein.`
        );
      }

      guestNames.set(player.id, displayName);
    }
  }

  await prisma.$transaction(async (tx) => {
    const orderedPlayers = await applyPlayerOrder(tx, game.players, playerOrder);

    for (const [playerId, displayName] of guestNames.entries()) {
      await tx.gamePlayer.update({
        data: {
          displayName
        },
        where: {
          id: playerId
        }
      });
    }

    await tx.game.update({
      data: {
        currentPlayerId: orderedPlayers[0].id,
        roundNumber: 1,
        status: "ACTIVE"
      },
      where: {
        id: game.id
      }
    });
  });

  redirect(`/games/${game.id}`);
}

export async function reorderPlayersAction(gameId: string, formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const errorPath = `/games/${gameId}`;
  const playerOrder = readPlayerOrder(formData);

  if (playerOrder.length === 0) {
    return;
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

      await applyPlayerOrder(tx, game.players, playerOrder);
      await touchGame(tx, game.id);
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reihenfolge konnte nicht geaendert werden.";

    redirectWithError(errorPath, message);
  }

  revalidatePath(errorPath);
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

      await touchGame(tx, game.id);
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

function createSimulatedScoreCard(winner: boolean, offset: number) {
  const scoreCard = winner
    ? {
        chance: 25,
        fives: 15,
        fourOfAKind: 26,
        fours: 12,
        fullHouse: 25,
        kniffel: 50,
        largeStraight: 40,
        ones: 3,
        sixes: 18,
        smallStraight: 30,
        threeOfAKind: 24,
        threes: 9,
        twos: 6
      }
    : {
        chance: Math.max(10, 20 - offset),
        fives: Math.max(0, 10 - offset),
        fourOfAKind: Math.max(0, 18 - offset),
        fours: Math.max(0, 8 - offset),
        fullHouse: offset % 2 === 0 ? 25 : 0,
        kniffel: 0,
        largeStraight: offset % 3 === 0 ? 40 : 0,
        ones: Math.max(0, 2 - offset),
        sixes: Math.max(0, 12 - offset),
        smallStraight: 30,
        threeOfAKind: Math.max(0, 16 - offset),
        threes: Math.max(0, 6 - offset),
        twos: Math.max(0, 4 - offset)
      };

  return {
    ...scoreCard,
    total: calculateTotalScore(scoreCard),
    upperBonus: calculateUpperBonus(scoreCard)
  };
}

export async function simulateGameAction(gameId: string): Promise<void> {
  const user = await requireCurrentUser();
  const errorPath = `/games/${gameId}`;

  if (!isDebugAdmin(user)) {
    redirectWithError(errorPath, "Nur der Debug-User admin darf Spiele simulieren.");
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
          scoreCards: {
            select: {
              id: true,
              playerId: true
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

      if (game.players.length < 1) {
        throw new Error("Keine Spieler vorhanden.");
      }

      const winnerPlayer =
        game.players.find((player) => player.userId === user.id) ?? game.players[0];

      for (const [index, player] of game.players.entries()) {
        const scoreCard = game.scoreCards.find((entry) => entry.playerId === player.id);

        if (!scoreCard) {
          continue;
        }

        const simulatedScoreCard = createSimulatedScoreCard(
          player.id === winnerPlayer.id,
          index + 1
        );

        await tx.scoreCard.update({
          data: {
            ...simulatedScoreCard,
            struckCategories: []
          },
          where: {
            id: scoreCard.id
          }
        });
      }

      await tx.turn.create({
        data: {
          diceValues: [6, 6, 6, 6, 6],
          gameId: game.id,
          playerId: winnerPlayer.id,
          status: "FINISHED"
        }
      });

      await tx.game.update({
        data: {
          currentPlayerId: null,
          status: "FINISHED"
        },
        where: {
          id: game.id
        }
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Spiel konnte nicht simuliert werden.";

    redirectWithError(errorPath, message);
  }

  revalidatePath(errorPath);
  redirect(errorPath);
}


const BOT_TURN_REVEAL_DELAY_MS = 1800;

function waitForBotReveal(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function playBotTurnsUntilHumanTurn(gameId: string) {
  while (true) {
    const game = await prisma.game.findUnique({
      include: {
        players: {
          orderBy: {
            position: "asc"
          },
          select: {
            id: true,
            isBot: true
          }
        },
        scoreCards: true
      },
      where: {
        id: gameId
      }
    });

    if (!game || game.status !== "ACTIVE") {
      return;
    }

    const currentPlayer = game.players.find((player) => player.id === game.currentPlayerId);

    if (!currentPlayer?.isBot) {
      return;
    }

    const scoreCard = game.scoreCards.find((card) => card.playerId === currentPlayer.id);

    if (!scoreCard) {
      return;
    }

    let diceValues = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1).sort(
      (a, b) => a - b
    );

    for (let rollsLeft = 2; rollsLeft > 0; rollsLeft -= 1) {
      const decision = bot_decision(diceValues, rollsLeft, { difficulty: "hard", scorecard: scoreCard });

      if (decision.action !== "hold") {
        break;
      }

      const rerolled = decision.reroll.map(() => Math.floor(Math.random() * 6) + 1);
      diceValues = [...decision.hold, ...rerolled].sort((a, b) => a - b);
    }

    const scoreDecision = bot_decision(diceValues, 0, { difficulty: "hard", scorecard: scoreCard });

    if (scoreDecision.action !== "score") {
      return;
    }

    const nextScoreCard = updateScoreCard(scoreCard, scoreDecision.category, scoreDecision.points);
    const struckCategories = updateStruckCategories(
      scoreCard.struckCategories,
      scoreDecision.category,
      scoreDecision.points === 0
    );

    const updatedCards = game.scoreCards.map((card) =>
      card.id === scoreCard.id
        ? {
            ...card,
            [scoreDecision.category]: scoreDecision.points,
            struckCategories,
            total: nextScoreCard.total,
            upperBonus: nextScoreCard.upperBonus
          }
        : card
    );

    await prisma.$transaction(async (tx) => {
      await tx.scoreCard.update({
        data: {
          [scoreDecision.category]: scoreDecision.points,
          struckCategories,
          total: nextScoreCard.total,
          upperBonus: nextScoreCard.upperBonus
        } as Prisma.ScoreCardUpdateInput,
        where: { id: scoreCard.id }
      });

      await tx.turn.create({
        data: {
          diceValues,
          gameId: game.id,
          playerId: currentPlayer.id,
          status: "FINISHED"
        }
      });

      if (areAllScoreCardsComplete(updatedCards)) {
        await tx.game.update({
          data: { currentPlayerId: null, status: "FINISHED" },
          where: { id: game.id }
        });
        return;
      }

      const nextTurn = determineNextPlayer(game.players, currentPlayer.id);
      await tx.game.update({
        data: {
          currentPlayerId: nextTurn.nextPlayerId,
          roundNumber: nextTurn.completedRotation ? game.roundNumber + 1 : game.roundNumber
        },
        where: { id: game.id }
      });
    });

    await waitForBotReveal(BOT_TURN_REVEAL_DELAY_MS);
  }
}

export async function enterScoreAction(gameId: string, formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const errorPath = `/games/${gameId}`;
  const categoryValue = readString(formData, "category");
  const mode = readString(formData, "mode");
  const entryMode = readEntryMode(formData, mode);
  let diceValues: number[] = [];
  let manualPoints: number | null = null;

  if (!isScoreCategory(categoryValue)) {
    redirectWithError(errorPath, "Ungueltige Kategorie.");
  }

  if (mode !== "dice" && mode !== "manual") {
    redirectWithError(errorPath, "Ungueltiger Eintrag.");
  }

  await expireInactiveActiveGame(gameId);

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

      if (
        currentPlayer.userId !== user.id &&
        (currentPlayer.userId !== null || game.ownerId !== user.id)
      ) {
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

      const turnData = {
        diceValues: mode === "dice" ? diceValues : [],
        entryCategory: categoryValue,
        entryMode,
        entryPoints: points,
        gameId: game.id,
        playerId: currentPlayer.id,
        status: "FINISHED" as const
      };

      if (entryMode === "online") {
        const activeTurn = await tx.turn.findFirst({
          orderBy: {
            updatedAt: "desc"
          },
          where: {
            gameId: game.id,
            playerId: currentPlayer.id,
            status: "ACTIVE"
          }
        });

        if (activeTurn) {
          await tx.turn.update({
            data: turnData,
            where: {
              id: activeTurn.id
            }
          });
        } else {
          await tx.turn.create({
            data: turnData
          });
        }
      } else {
        await tx.turn.create({
          data: turnData
        });
      }

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
    await playBotTurnsUntilHumanTurn(gameId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Punkte konnten nicht gespeichert werden.";

    redirectWithError(errorPath, message);
  }

  revalidatePath(`/games/${gameId}`);
}

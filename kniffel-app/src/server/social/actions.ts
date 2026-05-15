"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/session";

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(error: string): never {
  redirect(`/social?error=${encodeURIComponent(error)}`);
}

function orderedFriendshipPair(firstUserId: string, secondUserId: string) {
  return firstUserId < secondUserId
    ? { friendId: secondUserId, userId: firstUserId }
    : { friendId: firstUserId, userId: secondUserId };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function sendFriendRequestAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const username = readString(formData, "username");

  if (!username) {
    redirectWithError("Username fehlt.");
  }

  const target = await prisma.user.findUnique({
    select: {
      id: true
    },
    where: {
      username
    }
  });

  if (!target) {
    redirectWithError("User wurde nicht gefunden.");
  }

  if (target.id === user.id) {
    redirectWithError("Du kannst dir selbst keine Anfrage senden.");
  }

  const friendshipPair = orderedFriendshipPair(user.id, target.id);
  const existingFriendship = await prisma.friendship.findUnique({
    where: {
      userId_friendId: friendshipPair
    }
  });

  if (existingFriendship) {
    redirectWithError("Ihr seid bereits befreundet.");
  }

  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { receiverId: target.id, senderId: user.id },
        { receiverId: user.id, senderId: target.id }
      ]
    }
  });

  if (existingRequest) {
    redirectWithError("Eine Anfrage ist bereits offen.");
  }

  try {
    await prisma.friendRequest.create({
      data: {
        receiverId: target.id,
        senderId: user.id
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWithError("Eine Anfrage ist bereits offen.");
    }

    redirectWithError("Anfrage konnte nicht gesendet werden.");
  }

  revalidatePath("/social");
}

export async function acceptFriendRequestAction(requestId: string): Promise<void> {
  const user = await requireCurrentUser();

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.friendRequest.findUnique({
        where: {
          id: requestId
        }
      });

      if (!request || request.receiverId !== user.id) {
        throw new Error("Anfrage wurde nicht gefunden.");
      }

      const friendshipPair = orderedFriendshipPair(request.senderId, request.receiverId);

      await tx.friendship.create({
        data: friendshipPair
      });

      await tx.friendRequest.deleteMany({
        where: {
          OR: [
            { receiverId: request.receiverId, senderId: request.senderId },
            { receiverId: request.senderId, senderId: request.receiverId }
          ]
        }
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      await prisma.friendRequest.delete({
        where: {
          id: requestId
        }
      });
      revalidatePath("/social");
      return;
    }

    const message = error instanceof Error ? error.message : "Anfrage konnte nicht angenommen werden.";

    redirectWithError(message);
  }

  revalidatePath("/social");
}

export async function declineFriendRequestAction(requestId: string): Promise<void> {
  const user = await requireCurrentUser();

  await prisma.friendRequest.deleteMany({
    where: {
      id: requestId,
      receiverId: user.id
    }
  });

  revalidatePath("/social");
}

export async function removeFriendAction(friendId: string): Promise<void> {
  const user = await requireCurrentUser();
  const friendshipPair = orderedFriendshipPair(user.id, friendId);

  await prisma.friendship.deleteMany({
    where: friendshipPair
  });

  revalidatePath("/social");
}

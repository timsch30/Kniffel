import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { expireInactiveActiveGames } from "@/server/game/expiration";

const ONLINE_THRESHOLD_MS = 30_000;

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  await expireInactiveActiveGames();

  const onlineSince = new Date(Date.now() - ONLINE_THRESHOLD_MS);
  const friendships = await prisma.friendship.findMany({
    include: {
      friend: {
        select: {
          id: true,
          lastSeenAt: true,
          username: true
        }
      },
      user: {
        select: {
          id: true,
          lastSeenAt: true,
          username: true
        }
      }
    },
    where: {
      OR: [{ userId: user.id }, { friendId: user.id }]
    }
  });

  const onlineFriendUsers = [
    ...new Map(
      friendships.flatMap((friendship) => {
        const friend = friendship.userId === user.id ? friendship.friend : friendship.user;

        if (!friend.lastSeenAt || friend.lastSeenAt < onlineSince) {
          return [];
        }

        return [
          [
            friend.id,
            friend
          ]
        ];
      })
    ).values()
  ];
  const activeFriendPlayers = onlineFriendUsers.length
    ? await prisma.gamePlayer.findMany({
        select: {
          userId: true
        },
        where: {
          game: {
            status: "ACTIVE"
          },
          userId: {
            in: onlineFriendUsers.map((friend) => friend.id)
          }
        }
      })
    : [];
  const activeFriendUserIds = new Set(
    activeFriendPlayers.flatMap((player) => (player.userId ? [player.userId] : []))
  );
  const onlineFriends = onlineFriendUsers
    .map((friend) => ({
      id: friend.id,
      inGame: activeFriendUserIds.has(friend.id),
      lastSeenAt: friend.lastSeenAt!.toISOString(),
      username: friend.username
    }))
    .sort((left, right) => left.username.localeCompare(right.username, "de"));

  return NextResponse.json({ friends: onlineFriends });
}

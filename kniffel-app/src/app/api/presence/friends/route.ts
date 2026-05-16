import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

const ONLINE_THRESHOLD_MS = 30_000;

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

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

  const onlineFriends = [
    ...new Map(
      friendships.flatMap((friendship) => {
        const friend = friendship.userId === user.id ? friendship.friend : friendship.user;

        if (!friend.lastSeenAt || friend.lastSeenAt < onlineSince) {
          return [];
        }

        return [
          [
            friend.id,
            {
              id: friend.id,
              lastSeenAt: friend.lastSeenAt.toISOString(),
              username: friend.username
            }
          ]
        ];
      })
    ).values()
  ].sort((left, right) => left.username.localeCompare(right.username, "de"));

  return NextResponse.json({ friends: onlineFriends });
}

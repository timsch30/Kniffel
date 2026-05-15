import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/session";
import type { Friend } from "@/social/types";

export type SocialFriendRequest = {
  createdAt: string;
  id: string;
  username: string;
};

export type SocialState = {
  friends: Friend[];
  incomingRequests: SocialFriendRequest[];
  outgoingRequests: SocialFriendRequest[];
};

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function colorForId(id: string): string {
  const colors = [
    "bg-emerald-600 text-white",
    "bg-amber-500 text-white",
    "bg-sky-600 text-white",
    "bg-rose-600 text-white",
    "bg-felt text-white"
  ];
  const charSum = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return colors[charSum % colors.length] ?? colors[0];
}

function toFriend(user: { id: string; updatedAt: Date; username: string }): Friend {
  return {
    color: colorForId(user.id),
    favoriteCategory: "Offen",
    id: user.id,
    initials: initials(user.username),
    lastActiveAt: user.updatedAt.toISOString(),
    name: user.username,
    relationshipStatus: "accepted"
  };
}

export async function getSocialState(): Promise<SocialState> {
  const user = await requireCurrentUser();

  const [friendships, incomingRequests, outgoingRequests] = await Promise.all([
    prisma.friendship.findMany({
      include: {
        friend: {
          select: {
            id: true,
            updatedAt: true,
            username: true
          }
        },
        user: {
          select: {
            id: true,
            updatedAt: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      where: {
        OR: [{ userId: user.id }, { friendId: user.id }]
      }
    }),
    prisma.friendRequest.findMany({
      include: {
        sender: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      where: {
        receiverId: user.id
      }
    }),
    prisma.friendRequest.findMany({
      include: {
        receiver: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      where: {
        senderId: user.id
      }
    })
  ]);

  return {
    friends: friendships.map((friendship) =>
      toFriend(friendship.userId === user.id ? friendship.friend : friendship.user)
    ),
    incomingRequests: incomingRequests.map((request) => ({
      createdAt: request.createdAt.toISOString(),
      id: request.id,
      username: request.sender.username
    })),
    outgoingRequests: outgoingRequests.map((request) => ({
      createdAt: request.createdAt.toISOString(),
      id: request.id,
      username: request.receiver.username
    }))
  };
}

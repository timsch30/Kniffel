import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const [friendRequests, gameInvitations] = await Promise.all([
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
    prisma.gameInvitation.findMany({
      include: {
        game: {
          include: {
            _count: {
              select: {
                players: true
              }
            }
          }
        },
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
        receiverId: user.id,
        status: "PENDING"
      }
    })
  ]);

  return NextResponse.json({
    friendRequests: friendRequests.map((request) => ({
      id: request.id,
      username: request.sender.username
    })),
    gameInvitations: gameInvitations.map((invitation) => ({
      gameName: invitation.game.name,
      id: invitation.id,
      playerCount: invitation.game._count.players,
      senderUsername: invitation.sender.username
    }))
  });
}

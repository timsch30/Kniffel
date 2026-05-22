import { redirect } from "next/navigation";

import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { PageContainer } from "@/components/layout/PageContainer";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type JoinPageProps = {
  params: Promise<{
    inviteCode: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { inviteCode } = await params;
  const normalizedInviteCode = decodeURIComponent(inviteCode).trim().toUpperCase();
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `/login?error=${encodeURIComponent("Bitte zuerst einloggen.")}&redirectTo=${encodeURIComponent(
        `/join/${encodeURIComponent(normalizedInviteCode)}`
      )}`
    );
  }

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
    return (
      <>
        <DashboardBackdrop />
        <PageContainer className="grid min-h-[calc(100svh-5rem)] content-center" size="sm">
        <Card
          className="!border-white/10 !bg-white/[0.09] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-7"
          title="Runde nicht gefunden"
        >
          <Alert variant="danger">Runde nicht gefunden.</Alert>
        </Card>
        </PageContainer>
      </>
    );
  }

  if (game.status === "FINISHED") {
    return (
      <>
        <DashboardBackdrop />
        <PageContainer className="grid min-h-[calc(100svh-5rem)] content-center" size="sm">
        <Card
          className="!border-white/10 !bg-white/[0.09] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-7"
          title="Runde beendet"
        >
          <Alert variant="danger">Diese Runde ist bereits beendet.</Alert>
        </Card>
        </PageContainer>
      </>
    );
  }

  if (game.players.some((player) => player.userId === user.id)) {
    redirect(`/games/${game.id}`);
  }

  await prisma.$transaction(async (tx) => {
    const players = await tx.gamePlayer.findMany({
      orderBy: {
        position: "asc"
      },
      select: {
        position: true,
        userId: true
      },
      where: {
        gameId: game.id
      }
    });

    if (players.some((player) => player.userId === user.id)) {
      return;
    }

    const nextPosition =
      players.reduce((highestPosition, player) => Math.max(highestPosition, player.position), 0) +
      1;

    const gamePlayer = await tx.gamePlayer.create({
      data: {
        displayName: user.username,
        gameId: game.id,
        position: nextPosition,
        userId: user.id
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

  redirect(`/games/${game.id}`);
}

import Link from "next/link";

import { DoorOpen, Plus, Search, Trophy, UserRoundPlus, UsersRound } from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Aktiv",
    FINISHED: "Beendet",
    LOBBY: "Lobby"
  };

  return labels[status] ?? status;
}

function statusVariant(status: string): "accent" | "neutral" | "success" | "warning" {
  if (status === "ACTIVE") {
    return "success";
  }

  if (status === "LOBBY") {
    return "warning";
  }

  return "neutral";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const gamePlayers = await prisma.gamePlayer.findMany({
    include: {
      game: {
        include: {
          _count: {
            select: {
              players: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    where: {
      userId: user.id
    }
  });
  const activeGames = gamePlayers.filter(({ game }) => game.status === "ACTIVE").length;
  const lobbyGames = gamePlayers.filter(({ game }) => game.status === "LOBBY").length;
  const playerCount = gamePlayers.reduce((sum, { game }) => sum + game._count.players, 0);
  const stats = [
    { icon: Trophy, label: "Aktive Runden", value: activeGames },
    { icon: UsersRound, label: "In Lobby", value: lobbyGames },
    { icon: Search, label: "Spieler gesamt", value: playerCount }
  ];

  return (
    <PageContainer className="grid gap-8" size="xl">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <Badge className="w-fit" variant="accent">
            Dashboard
          </Badge>
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
              Willkommen zurueck, {user.username}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
              Starte eine neue Runde oder springe direkt in ein laufendes Spiel.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className={buttonVariants("secondary")} href="/join">
            <DoorOpen aria-hidden="true" className="h-4 w-4" />
            Beitreten
          </Link>
          <Link className={buttonVariants("secondary")} href="/social">
            <UserRoundPlus aria-hidden="true" className="h-4 w-4" />
            Social Hub
          </Link>
          <Link className={buttonVariants("primary")} href="/games/new">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Neue Runde
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card className="p-4" key={label}>
            <div className="mb-4 flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <p className="text-sm font-medium">{label}</p>
              <Icon aria-hidden="true" className="h-4 w-4" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-ink dark:text-zinc-50">
              {value}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-zinc-50">
            Meine Runden
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">{gamePlayers.length} gesamt</p>
        </div>
        {gamePlayers.length === 0 ? (
          <EmptyState
            action={
              <Link className={buttonVariants("primary")} href="/games/new">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Erste Runde erstellen
              </Link>
            }
            description="Du bist noch in keiner Runde. Erstelle eine neue Runde oder tritt mit einem Invite-Code bei."
            icon={<Trophy aria-hidden="true" className="h-5 w-5" />}
            title="Noch keine Runden"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {gamePlayers.map(({ game }) => (
              <Card className="group h-full p-5" key={game.id}>
                <div className="grid h-full gap-5">
                  <div className="grid gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
                        {game.name}
                      </h3>
                      <Badge variant={statusVariant(game.status)}>{formatStatus(game.status)}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      Aktualisiert am {formatDate(game.updatedAt)}
                    </p>
                  </div>

                  <dl className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                      <dt className="text-slate-500 dark:text-zinc-400">Invite-Code</dt>
                      <dd className="font-mono font-semibold text-ink dark:text-zinc-100">
                        {game.inviteCode}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                      <dt className="text-slate-500 dark:text-zinc-400">Spieler</dt>
                      <dd className="font-semibold text-ink dark:text-zinc-100">
                        {game._count.players}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto">
                    <Link className={buttonVariants("secondary")} href={`/games/${game.id}`}>
                      Oeffnen
                      <DoorOpen aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}

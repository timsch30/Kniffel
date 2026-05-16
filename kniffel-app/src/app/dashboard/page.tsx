import Link from "next/link";

import {
  DoorOpen,
  Plus,
  Radio,
  Trash2,
  Trophy,
  UserMinus,
  UserRoundPlus,
  UsersRound
} from "lucide-react";

import {
  DashboardRequests,
  type DashboardRequestsState
} from "@/components/dashboard/DashboardRequests";
import { PageContainer } from "@/components/layout/PageContainer";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/session";
import {
  acceptGameInvitationAction,
  declineGameInvitationAction,
  deleteGameAction,
  leaveGameAction
} from "@/server/game/actions";
import {
  acceptFriendRequestAction,
  declineFriendRequestAction
} from "@/server/social/actions";
import { getSocialState } from "@/server/social/state";

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

function GameExitButton({
  gameId,
  isOwner
}: {
  gameId: string;
  isOwner: boolean;
}) {
  const action = isOwner ? deleteGameAction : leaveGameAction;
  const Icon = isOwner ? Trash2 : UserMinus;
  const label = isOwner ? "Loeschen" : "Verlassen";

  return (
    <form action={action.bind(null, gameId)}>
      <button
        aria-label={label}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:border-red-500/20 hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:border-red-400/20 dark:hover:bg-red-400/10 dark:hover:text-red-200"
        type="submit"
      >
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </button>
    </form>
  );
}

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser();
  const { error } = await searchParams;
  const [gamePlayers, gameInvitations, socialState] = await Promise.all([
    prisma.gamePlayer.findMany({
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
    }),
    getSocialState()
  ]);
  const activeGames = gamePlayers.filter(({ game }) => game.status === "ACTIVE").length;
  const lobbyGames = gamePlayers.filter(({ game }) => game.status === "LOBBY").length;
  const friendsOnline = socialState.friends.length;
  const primaryGamePlayers = gamePlayers.filter(({ game }) => game.status !== "FINISHED");
  const archivedGamePlayers = gamePlayers.filter(({ game }) => game.status === "FINISHED");
  const initialRequests: DashboardRequestsState = {
    friendRequests: socialState.incomingRequests.map((request) => ({
      id: request.id,
      username: request.username
    })),
    gameInvitations: gameInvitations.map((invitation) => ({
      gameName: invitation.game.name,
      id: invitation.id,
      playerCount: invitation.game._count.players,
      senderUsername: invitation.sender.username
    }))
  };
  const stats = [
    { icon: Trophy, label: "Aktive Runden", value: activeGames },
    { icon: UsersRound, label: "In Lobby", value: lobbyGames },
    { icon: Radio, label: "Freunde online", value: friendsOnline }
  ];

  return (
    <PageContainer className="grid gap-8" size="xl">
      {error ? <Alert variant="danger">{error}</Alert> : null}

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

      <DashboardRequests
        acceptFriendRequestAction={acceptFriendRequestAction}
        acceptGameInvitationAction={acceptGameInvitationAction}
        declineFriendRequestAction={declineFriendRequestAction}
        declineGameInvitationAction={declineGameInvitationAction}
        initialRequests={initialRequests}
      />

      <section className="grid grid-cols-3 gap-2">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card className="p-3 shadow-sm sm:p-3.5" key={label}>
            <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-zinc-400">
              <p className="truncate text-[0.7rem] font-semibold uppercase sm:text-xs">{label}</p>
              <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            </div>
            <p className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl dark:text-zinc-50">
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
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {primaryGamePlayers.length} aktiv
          </p>
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
        ) : primaryGamePlayers.length === 0 ? (
          <EmptyState
            action={
              <Link className={buttonVariants("primary")} href="/games/new">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Neue Runde erstellen
              </Link>
            }
            description="Aktuell gibt es keine aktive Runde und keine Lobby. Alte Runden liegen im Archiv."
            icon={<Trophy aria-hidden="true" className="h-5 w-5" />}
            title="Keine aktiven Runden"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {primaryGamePlayers.map(({ game }) => {
              const isOwner = game.ownerId === user.id;

              return (
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

                  <div className="mt-auto flex items-end justify-between gap-2">
                    <Link className={buttonVariants("secondary")} href={`/games/${game.id}`}>
                      Oeffnen
                      <DoorOpen aria-hidden="true" className="h-4 w-4" />
                    </Link>
                    <GameExitButton gameId={game.id} isOwner={isOwner} />
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </section>

      {archivedGamePlayers.length > 0 ? (
        <section className="grid gap-3">
          <details className="group rounded-lg border border-slate-200/75 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
                  Archiv
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  {archivedGamePlayers.length} beendete Runden
                </p>
              </div>
              <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors group-open:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:group-open:bg-white/10">
                Archiv anzeigen
              </span>
            </summary>
            <div className="mt-4 grid gap-2">
              {archivedGamePlayers.map(({ game }) => {
                const isOwner = game.ownerId === user.id;

                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]"
                    key={game.id}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink dark:text-zinc-50">
                          {game.name}
                        </p>
                        <Badge variant="neutral">{formatStatus(game.status)}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                        Aktualisiert am {formatDate(game.updatedAt)} / {game._count.players} Spieler
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-ink dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                        href={`/games/${game.id}`}
                      >
                        Oeffnen
                      </Link>
                      <GameExitButton gameId={game.id} isOwner={isOwner} />
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </section>
      ) : null}
    </PageContainer>
  );
}

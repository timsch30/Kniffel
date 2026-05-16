"use client";

import { useCallback, useEffect, useState } from "react";

import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";

export type DashboardRequestsState = {
  friendRequests: {
    id: string;
    username: string;
  }[];
  gameInvitations: {
    gameName: string;
    id: string;
    playerCount: number;
    senderUsername: string;
  }[];
};

type DashboardRequestsProps = {
  acceptFriendRequestAction: (requestId: string) => void | Promise<void>;
  acceptGameInvitationAction: (invitationId: string) => void | Promise<void>;
  declineFriendRequestAction: (requestId: string) => void | Promise<void>;
  declineGameInvitationAction: (invitationId: string) => void | Promise<void>;
  initialRequests: DashboardRequestsState;
};

export function DashboardRequests({
  acceptFriendRequestAction,
  acceptGameInvitationAction,
  declineFriendRequestAction,
  declineGameInvitationAction,
  initialRequests
}: DashboardRequestsProps) {
  const [requests, setRequests] = useState(initialRequests);

  const refreshRequests = useCallback(async () => {
    const response = await fetch("/api/dashboard/requests", {
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    setRequests((await response.json()) as DashboardRequestsState);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshRequests();
    }, 4000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void refreshRequests();
      }
    }

    window.addEventListener("focus", refreshRequests);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshRequests);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshRequests]);

  const openCount = requests.friendRequests.length + requests.gameInvitations.length;

  if (openCount === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 rounded-lg border border-amber-300/50 bg-amber-50/90 p-4 shadow-card dark:border-amber-300/20 dark:bg-amber-300/10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-amber-950 dark:text-amber-50">
          Offene Anfragen
        </h2>
        <Badge variant="warning">{openCount} offen</Badge>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {requests.friendRequests.map((request) => (
          <Card
            className="border-amber-300/50 bg-white/90 p-5 dark:border-amber-300/20 dark:bg-white/10"
            key={request.id}
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Badge className="w-fit" variant="warning">
                  Freundschaftsanfrage
                </Badge>
                <h3 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
                  {request.username}
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Moechte dich als Freund hinzufuegen.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={acceptFriendRequestAction.bind(null, request.id)}>
                  <SubmitButton pendingLabel="Nimmt an...">
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Annehmen
                  </SubmitButton>
                </form>
                <form action={declineFriendRequestAction.bind(null, request.id)}>
                  <Button type="submit" variant="ghost">
                    <X aria-hidden="true" className="h-4 w-4" />
                    Ablehnen
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        ))}

        {requests.gameInvitations.map((invitation) => (
          <Card
            className="border-amber-300/50 bg-white/90 p-5 dark:border-amber-300/20 dark:bg-white/10"
            key={invitation.id}
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Badge className="w-fit" variant="warning">
                  Spieleinladung
                </Badge>
                <h3 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
                  {invitation.gameName}
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Von {invitation.senderUsername} / {invitation.playerCount} Spieler
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={acceptGameInvitationAction.bind(null, invitation.id)}>
                  <SubmitButton pendingLabel="Tritt bei...">
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Annehmen
                  </SubmitButton>
                </form>
                <form action={declineGameInvitationAction.bind(null, invitation.id)}>
                  <Button type="submit" variant="ghost">
                    <X aria-hidden="true" className="h-4 w-4" />
                    Ablehnen
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

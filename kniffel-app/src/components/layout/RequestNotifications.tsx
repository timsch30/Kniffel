"use client";

import { useCallback, useRef } from "react";

import { Check, X } from "lucide-react";

import { useVisiblePolling } from "@/components/hooks/useVisiblePolling";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useNotifications } from "@/components/notifications/NotificationProvider";

const REQUEST_POLL_INTERVAL_MS = 12_000;
const REQUEST_TOAST_DURATION_MS = 8_000;

type DashboardRequestsResponse = {
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

type RequestNotificationsProps = {
  acceptFriendRequestAction: (requestId: string) => void | Promise<void>;
  acceptGameInvitationAction: (invitationId: string) => void | Promise<void>;
  declineFriendRequestAction: (requestId: string) => void | Promise<void>;
  declineGameInvitationAction: (invitationId: string) => void | Promise<void>;
};

function dispatchDashboardRequests(requests: DashboardRequestsResponse) {
  window.dispatchEvent(
    new CustomEvent("kniffel:dashboard-requests", {
      detail: requests
    })
  );
}

export function RequestNotifications({
  acceptFriendRequestAction,
  acceptGameInvitationAction,
  declineFriendRequestAction,
  declineGameInvitationAction
}: RequestNotificationsProps) {
  const { dismissNotification, notify } = useNotifications();
  const knownFriendRequestIdsRef = useRef<Set<string> | null>(null);
  const knownGameInvitationIdsRef = useRef<Set<string> | null>(null);

  const dismissAfterSubmit = useCallback((notificationId: string) => {
    window.setTimeout(() => dismissNotification(notificationId), 0);
  }, [dismissNotification]);

  const refreshRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/requests", {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as DashboardRequestsResponse;
      dispatchDashboardRequests(data);

      const nextFriendRequestIds = new Set(data.friendRequests.map((request) => request.id));
      const nextGameInvitationIds = new Set(data.gameInvitations.map((invitation) => invitation.id));
      const knownFriendRequestIds = knownFriendRequestIdsRef.current;
      const knownGameInvitationIds = knownGameInvitationIdsRef.current;

      if (!knownFriendRequestIds || !knownGameInvitationIds) {
        knownFriendRequestIdsRef.current = nextFriendRequestIds;
        knownGameInvitationIdsRef.current = nextGameInvitationIds;
        return;
      }

      data.friendRequests
        .filter((request) => !knownFriendRequestIds.has(request.id))
        .reverse()
        .forEach((request) => {
          const notificationId = `friend-request:${request.id}`;

          notify({
            actions: (
              <>
                <form
                  action={acceptFriendRequestAction.bind(null, request.id)}
                  onSubmit={() => dismissAfterSubmit(notificationId)}
                >
                  <SubmitButton
                    className="min-h-9 px-3 py-2 text-xs"
                    pendingLabel="Nimmt an..."
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Annehmen
                  </SubmitButton>
                </form>
                <form
                  action={declineFriendRequestAction.bind(null, request.id)}
                  onSubmit={() => dismissAfterSubmit(notificationId)}
                >
                  <Button
                    className="min-h-9 px-3 py-2 text-xs"
                    type="submit"
                    variant="ghost"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                    Ablehnen
                  </Button>
                </form>
              </>
            ),
            durationMs: REQUEST_TOAST_DURATION_MS,
            id: notificationId,
            kind: "friend_request",
            message: `${request.username} moechte dich als Freund hinzufuegen.`,
            title: "Neue Freundschaftsanfrage"
          });
        });

      data.gameInvitations
        .filter((invitation) => !knownGameInvitationIds.has(invitation.id))
        .reverse()
        .forEach((invitation) => {
          const notificationId = `game-invite:${invitation.id}`;

          notify({
            actions: (
              <>
                <form
                  action={acceptGameInvitationAction.bind(null, invitation.id)}
                  onSubmit={() => dismissAfterSubmit(notificationId)}
                >
                  <SubmitButton
                    className="min-h-9 px-3 py-2 text-xs"
                    pendingLabel="Tritt bei..."
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Beitreten
                  </SubmitButton>
                </form>
                <form
                  action={declineGameInvitationAction.bind(null, invitation.id)}
                  onSubmit={() => dismissAfterSubmit(notificationId)}
                >
                  <Button
                    className="min-h-9 px-3 py-2 text-xs"
                    type="submit"
                    variant="ghost"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                    Ablehnen
                  </Button>
                </form>
              </>
            ),
            durationMs: REQUEST_TOAST_DURATION_MS,
            id: notificationId,
            kind: "game_invite",
            message: `${invitation.senderUsername} laedt dich in "${invitation.gameName}" ein.`,
            meta: [`${invitation.playerCount} Spieler`],
            title: "Neue Spieleinladung"
          });
        });

      knownFriendRequestIdsRef.current = nextFriendRequestIds;
      knownGameInvitationIdsRef.current = nextGameInvitationIds;
    } catch {
      // Request notifications are best-effort.
    }
  }, [
    acceptFriendRequestAction,
    acceptGameInvitationAction,
    declineFriendRequestAction,
    declineGameInvitationAction,
    dismissAfterSubmit,
    notify
  ]);

  useVisiblePolling(refreshRequests, {
    intervalMs: REQUEST_POLL_INTERVAL_MS
  });

  return null;
}

"use client";

import { useCallback, useRef } from "react";

import { useVisiblePolling } from "@/components/hooks/useVisiblePolling";
import { useNotifications } from "@/components/notifications/NotificationProvider";

const FRIEND_PRESENCE_INTERVAL_MS = 20_000;
const TOAST_DURATION_MS = 3_000;

type OnlineFriend = {
  id: string;
  inGame: boolean;
  lastSeenAt: string;
  username: string;
};

type PresenceFriendsResponse = {
  friends: OnlineFriend[];
};

type PresenceToast = {
  id: string;
  message: string;
};

function dispatchFriendsPresence(friends: OnlineFriend[]) {
  window.dispatchEvent(
    new CustomEvent("kniffel:friends-presence", {
      detail: {
        friends,
        onlineCount: friends.length
      }
    })
  );
}

export function PresenceNotifications() {
  const { notify } = useNotifications();
  const knownOnlineIdsRef = useRef<Set<string> | null>(null);

  const checkFriendsPresence = useCallback(async () => {
    function showToast(friend: OnlineFriend) {
      const toast: PresenceToast = {
        id: `${friend.id}-${friend.lastSeenAt}`,
        message: friend.inGame ? `${friend.username} ist im Spiel.` : `${friend.username} ist online.`
      };

      notify({
        durationMs: TOAST_DURATION_MS,
        id: `presence:${toast.id}`,
        kind: "presence",
        message: toast.message,
        title: "Freund online"
      });
    }

    try {
      const response = await fetch("/api/presence/friends", {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as PresenceFriendsResponse;
      dispatchFriendsPresence(data.friends);

      const nextOnlineIds = new Set(data.friends.map((friend) => friend.id));
      const knownOnlineIds = knownOnlineIdsRef.current;

      if (!knownOnlineIds) {
        knownOnlineIdsRef.current = nextOnlineIds;
        return;
      }

      const newOnlineFriend = data.friends.find((friend) => !knownOnlineIds.has(friend.id));

      knownOnlineIdsRef.current = nextOnlineIds;

      if (newOnlineFriend) {
        showToast(newOnlineFriend);
      }
    } catch {
      // Presence notifications are best-effort.
    }
  }, [notify]);

  useVisiblePolling(checkFriendsPresence, {
    intervalMs: FRIEND_PRESENCE_INTERVAL_MS
  });

  return null;
}

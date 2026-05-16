"use client";

import { useEffect, useRef, useState } from "react";

const FRIEND_PRESENCE_INTERVAL_MS = 10_000;
const TOAST_DURATION_MS = 3_000;

type OnlineFriend = {
  id: string;
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
  const [toast, setToast] = useState<PresenceToast | null>(null);
  const knownOnlineIdsRef = useRef<Set<string> | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    function showToast(friend: OnlineFriend) {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }

      setToast({
        id: `${friend.id}-${friend.lastSeenAt}`,
        message: `${friend.username} ist online.`
      });

      toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, TOAST_DURATION_MS);
    }

    async function checkFriendsPresence() {
      if (!active || document.visibilityState !== "visible") {
        return;
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
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkFriendsPresence();
      }
    }

    void checkFriendsPresence();

    const intervalId = window.setInterval(() => {
      void checkFriendsPresence();
    }, FRIEND_PRESENCE_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex justify-center px-4">
      <div
        className="rounded-lg border border-emerald-500/25 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-card dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100 dark:shadow-card-dark"
        key={toast.id}
        role="status"
      >
        {toast.message}
      </div>
    </div>
  );
}

import { AchievementNotifications } from "@/components/layout/AchievementNotifications";
import { HeaderContent } from "@/components/layout/HeaderContent";
import { PresenceHeartbeat } from "@/components/layout/PresenceHeartbeat";
import { PresenceNotifications } from "@/components/layout/PresenceNotifications";
import { RequestNotifications } from "@/components/layout/RequestNotifications";
import { logoutAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";
import {
  acceptGameInvitationAction,
  declineGameInvitationAction
} from "@/server/game/actions";
import {
  acceptFriendRequestAction,
  declineFriendRequestAction
} from "@/server/social/actions";

type HeaderProps = {
  className?: string;
};

export async function Header({ className }: HeaderProps) {
  const user = await getCurrentUser();

  return (
    <>
      {user ? (
        <>
          <AchievementNotifications userId={user.id} />
          <PresenceHeartbeat />
          <PresenceNotifications />
          <RequestNotifications
            acceptFriendRequestAction={acceptFriendRequestAction}
            acceptGameInvitationAction={acceptGameInvitationAction}
            declineFriendRequestAction={declineFriendRequestAction}
            declineGameInvitationAction={declineGameInvitationAction}
          />
        </>
      ) : null}
      <HeaderContent
        className={className}
        isAuthenticated={Boolean(user)}
        logoutAction={logoutAction}
      />
    </>
  );
}

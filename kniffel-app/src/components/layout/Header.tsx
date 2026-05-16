import { HeaderContent } from "@/components/layout/HeaderContent";
import { PresenceHeartbeat } from "@/components/layout/PresenceHeartbeat";
import { PresenceNotifications } from "@/components/layout/PresenceNotifications";
import { logoutAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";

type HeaderProps = {
  className?: string;
};

export async function Header({ className }: HeaderProps) {
  const user = await getCurrentUser();

  return (
    <>
      {user ? (
        <>
          <PresenceHeartbeat />
          <PresenceNotifications />
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

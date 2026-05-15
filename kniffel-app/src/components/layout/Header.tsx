import { HeaderContent } from "@/components/layout/HeaderContent";
import { logoutAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";

type HeaderProps = {
  className?: string;
};

export async function Header({ className }: HeaderProps) {
  const user = await getCurrentUser();

  return (
    <HeaderContent
      className={className}
      isAuthenticated={Boolean(user)}
      logoutAction={logoutAction}
    />
  );
}

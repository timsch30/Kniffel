import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { PageContainer } from "@/components/layout/PageContainer";
import { SocialDashboard } from "@/components/social/SocialDashboard";
import { requireCurrentUser } from "@/server/auth/session";
import {
  acceptFriendRequestAction,
  declineFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction
} from "@/server/social/actions";
import { getSocialState } from "@/server/social/state";

export const dynamic = "force-dynamic";

type SocialPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SocialPage({ searchParams }: SocialPageProps) {
  const user = await requireCurrentUser();
  const socialState = await getSocialState();
  const { error } = await searchParams;

  return (
    <>
      <DashboardBackdrop />
      <PageContainer className="grid gap-6 pb-16 pt-7 sm:pt-10" size="xl">
      <SocialDashboard
        acceptFriendRequestAction={acceptFriendRequestAction}
        declineFriendRequestAction={declineFriendRequestAction}
        error={error}
        removeFriendAction={removeFriendAction}
        sendFriendRequestAction={sendFriendRequestAction}
        socialState={socialState}
        userId={user.id}
        userName={user.username}
      />
      </PageContainer>
    </>
  );
}

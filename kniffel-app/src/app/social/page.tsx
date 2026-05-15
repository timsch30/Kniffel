import { PageContainer } from "@/components/layout/PageContainer";
import { SocialDashboard } from "@/components/social/SocialDashboard";
import { requireCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const user = await requireCurrentUser();

  return (
    <PageContainer className="grid gap-6" size="xl">
      <SocialDashboard userName={user.username} />
    </PageContainer>
  );
}

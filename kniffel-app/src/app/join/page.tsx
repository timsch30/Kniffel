import { PageContainer } from "@/components/layout/PageContainer";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { joinByCodeAction } from "@/server/game/actions";

export const dynamic = "force-dynamic";

type JoinCodePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function JoinCodePage({ searchParams }: JoinCodePageProps) {
  const { error } = await searchParams;

  return (
    <PageContainer className="grid min-h-[calc(100svh-5rem)] content-center" size="sm">
      <Card className="p-6 sm:p-7" eyebrow="Invite-Code" title="Spiel beitreten">
        {error ? <Alert className="mb-4" variant="danger">{error}</Alert> : null}
        <form action={joinByCodeAction} className="grid gap-4">
          <Input
            autoComplete="off"
            description="Den Code findest du in der Einladung der Runde."
            label="Invite-Code"
            name="inviteCode"
            placeholder="ABC123"
            required
            type="text"
          />
          <SubmitButton pendingLabel="Oeffne Runde...">Beitreten</SubmitButton>
        </form>
      </Card>
    </PageContainer>
  );
}

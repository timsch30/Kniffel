import { PageContainer } from "@/components/layout/PageContainer";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireCurrentUser } from "@/server/auth/session";
import { createGameAction } from "@/server/game/actions";

export const dynamic = "force-dynamic";

type NewGamePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewGamePage({ searchParams }: NewGamePageProps) {
  await requireCurrentUser();

  const { error } = await searchParams;

  return (
    <PageContainer className="grid min-h-[calc(100svh-5rem)] content-center" size="sm">
      <Card className="p-6 sm:p-7" eyebrow="Neue Runde" title="Runde erstellen">
        {error ? <Alert className="mb-4" variant="danger">{error}</Alert> : null}
        <form action={createGameAction} className="grid gap-4">
          <Input
            description="Kurz und eindeutig, damit Mitspieler die Runde sofort erkennen."
            label="Rundenname"
            maxLength={50}
            minLength={3}
            name="name"
            placeholder="Freitagabend"
            required
            type="text"
          />
          <SubmitButton pendingLabel="Runde wird erstellt...">Runde erstellen</SubmitButton>
        </form>
      </Card>
    </PageContainer>
  );
}

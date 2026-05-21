import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { PageContainer } from "@/components/layout/PageContainer";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { prisma } from "@/lib/prisma";
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
  const nextGameNumber = (await prisma.game.count()) + 1;
  const defaultGameName = `Kniffel#${nextGameNumber}`;

  return (
    <>
      <DashboardBackdrop />
      <PageContainer className="grid min-h-[calc(100svh-5rem)] content-center" size="sm">
      <Card
        className="!border-white/10 !bg-white/[0.09] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-7"
        eyebrow="Neue Runde"
        title="Runde erstellen"
      >
        {error ? <Alert className="mb-4" variant="danger">{error}</Alert> : null}
        <form action={createGameAction} className="grid gap-4">
          <Input
            description="Kurz und eindeutig, damit Mitspieler die Runde sofort erkennen."
            label="Rundenname"
            maxLength={50}
            minLength={3}
            name="name"
            defaultValue={defaultGameName}
            required
            type="text"
          />
          <Input
            defaultValue="0"
            description="Optional: Fuegt direkt beim Erstellen Computergegner hinzu."
            label="Bots"
            max={5}
            min={0}
            name="botCount"
            type="number"
          />
          <SubmitButton pendingLabel="Runde wird erstellt...">Runde erstellen</SubmitButton>
        </form>
      </Card>
      </PageContainer>
    </>
  );
}

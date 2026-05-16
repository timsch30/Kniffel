import Link from "next/link";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { registerAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <PageContainer className="grid min-h-[calc(100svh-5rem)] content-center" size="sm">
      <Card className="p-6 sm:p-7" eyebrow="Neues Konto" title="Registrieren">
        {error ? <Alert className="mb-4" variant="danger">{error}</Alert> : null}
        <form action={registerAction} className="grid gap-4">
          <Input autoComplete="username" label="Username" name="username" type="text" />
          <Input
            autoComplete="new-password"
            description="Mindestens 8 Zeichen."
            label="Passwort"
            name="password"
            type="password"
          />
          <Input
            autoComplete="new-password"
            label="Passwort wiederholen"
            name="passwordRepeat"
            type="password"
          />
          <SubmitButton pendingLabel="Erstelle Konto...">Registrieren</SubmitButton>
        </form>
        <p className="mt-5 text-sm text-slate-600 dark:text-zinc-400">
          Schon ein Konto?{" "}
          <Link className="font-semibold text-felt hover:text-ink dark:text-emerald-300 dark:hover:text-white" href="/login">
            Einloggen
          </Link>
        </p>
      </Card>
    </PageContainer>
  );
}

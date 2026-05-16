import Link from "next/link";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { loginAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const { error, redirectTo } = await searchParams;
  const safeRedirectTo =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  return (
    <PageContainer className="grid min-h-[calc(100svh-5rem)] content-center" size="sm">
      <Card className="p-6 sm:p-7" eyebrow="Willkommen zurueck" title="Einloggen">
        {error ? <Alert className="mb-4" variant="danger">{error}</Alert> : null}
        <form action={loginAction} className="grid gap-4">
          <input name="redirectTo" type="hidden" value={safeRedirectTo} />
          <Input autoComplete="username" label="Username" name="username" type="text" />
          <Input autoComplete="current-password" label="Passwort" name="password" type="password" />
          <SubmitButton pendingLabel="Melde an...">Einloggen</SubmitButton>
        </form>
        <p className="mt-5 text-sm text-slate-600 dark:text-zinc-400">
          Noch kein Konto?{" "}
          <Link className="font-semibold text-felt hover:text-ink dark:text-emerald-300 dark:hover:text-white" href="/register">
            Registrieren
          </Link>
        </p>
      </Card>
    </PageContainer>
  );
}

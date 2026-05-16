import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
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
    <>
      <DashboardBackdrop />
      <PageContainer className="felt-ui grid min-h-[calc(100svh-5rem)] content-center" size="sm">
      <Card
        className="!border-white/10 !bg-white/[0.09] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-7"
        eyebrow="Willkommen zurueck"
        title="Einloggen"
      >
        {error ? <Alert className="mb-4" variant="danger">{error}</Alert> : null}
        <form action={loginAction} className="grid gap-4">
          <input name="redirectTo" type="hidden" value={safeRedirectTo} />
          <Input autoComplete="username" label="Username" name="username" type="text" />
          <Input autoComplete="current-password" label="Passwort" name="password" type="password" />
          <SubmitButton pendingLabel="Melde an...">Einloggen</SubmitButton>
        </form>
        <p className="mt-5 text-sm text-emerald-50/70">
          Noch kein Konto?{" "}
          <Link className="font-semibold text-amber-100 hover:text-white" href="/register">
            Registrieren
          </Link>
        </p>
      </Card>
      </PageContainer>
    </>
  );
}

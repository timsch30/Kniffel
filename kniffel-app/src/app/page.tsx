import Link from "next/link";
import { redirect } from "next/navigation";

import { LogIn, UserPlus } from "lucide-react";

import { HomeTableScene } from "@/components/home/HomeTableScene";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/server/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <HomeTableScene />
      <section className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <div className="grid max-w-3xl gap-7 text-center">
          <h1 className="text-balance text-5xl font-semibold tracking-tight drop-shadow-[0_12px_42px_rgba(0,0,0,0.48)] sm:text-7xl">
            Kniffel Online
          </h1>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link className={buttonVariants("primary", "lg")} href="/login">
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Einloggen
            </Link>
            <Link className={buttonVariants("secondary", "lg")} href="/register">
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              Registrieren
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

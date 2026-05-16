import Link from "next/link";

import { ArrowRight, LogIn, Plus } from "lucide-react";

import { Dice } from "@/components/game/Dice";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <PageContainer className="grid min-h-[calc(100vh-8rem)] items-center" size="xl">
      <section className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid max-w-3xl gap-6">
          <Badge className="w-fit" variant="accent">
            Kniffel
          </Badge>
          <div className="grid gap-4">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl dark:text-zinc-50">
              Digitaler Spielblock fuer eure Runde.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-zinc-400">
              Punkte eintragen oder per Handy-Kamera scannen lassen, Freunde einladen, Runde starten.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className={buttonVariants("primary", "lg")} href="/games/new">
              <Plus aria-hidden="true" className="h-5 w-5" />
              Neue Runde
            </Link>
            <Link className={buttonVariants("secondary", "lg")} href="/join">
              Beitreten
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-zinc-400">
            <Link className={buttonVariants("ghost", "sm")} href="/login">
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Einloggen
            </Link>
            <Link className="font-semibold text-ink hover:text-felt dark:text-zinc-200" href="/register">
              Konto erstellen
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className="hidden grid-cols-3 gap-3 lg:grid">
          {[1, 2, 3, 4, 5, 6].map((value) => (
            <div
              className="grid h-20 w-20 place-items-center rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/5"
              key={value}
            >
              <Dice value={value} />
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

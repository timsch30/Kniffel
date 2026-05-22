import Link from "next/link";

import { ArrowRight, Plus } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <section className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <div className="grid max-w-3xl gap-7 text-center">
          <Badge className="mx-auto w-fit" variant="accent">
            Kniffel
          </Badge>
          <div className="grid gap-4">
            <h1 className="text-balance text-5xl font-semibold tracking-tight drop-shadow-[0_12px_42px_rgba(0,0,0,0.48)] sm:text-7xl">
              Kniffel Online
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Digitaler Spielblock fuer eure Runde: Punkte eintragen oder per Handy-Kamera scannen
              lassen, Freunde einladen und direkt losspielen.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link className={buttonVariants("primary", "lg")} href="/games/new">
              <Plus aria-hidden="true" className="h-5 w-5" />
              Neue Runde
            </Link>
            <Link className={buttonVariants("secondary", "lg")} href="/join">
              Beitreten
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex justify-center text-sm text-white/70">
            <Link className={buttonVariants("ghost", "sm")} href="/login">
              Einloggen
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

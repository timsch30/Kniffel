import Link from "next/link";

import { ArrowRight, LogIn, Plus, Sparkles, UsersRound } from "lucide-react";

import { Dice } from "@/components/game/Dice";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const previewRows = [
  ["Einser", "3", "-"],
  ["Full House", "-", "25"],
  ["Chance", "22", "18"],
  ["Gesamt", "25", "43"]
];

const qualityCards = [
  ["Live Block", "Punkte, Ranking und aktueller Zug bleiben fuer alle synchron."],
  ["Echte Wuerfel", "Ihr spielt am Tisch weiter analog und tragt nur die Ergebnisse ein."],
  ["Schneller Einstieg", "Code teilen, beitreten, starten. Kein Regelchaos im Nebenfenster."]
];

export default function HomePage() {
  return (
    <PageContainer className="grid gap-10" size="xl">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="grid gap-7">
          <div className="grid gap-5">
            <Badge className="w-fit" variant="accent">
              Digitaler Spielblock
            </Badge>
            <div className="grid gap-4">
              <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl dark:text-zinc-50">
                Kniffel-Runden sauber spielen, ohne Papierblock.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-zinc-400">
                Verwaltet Punkte, Spieler, Einladungen und Rundenstatus digital, waehrend ihr
                weiter mit echten Wuerfeln spielt.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className={buttonVariants("primary", "lg")} href="/games/new">
              <Plus aria-hidden="true" className="h-5 w-5" />
              Neue Runde starten
            </Link>
            <Link className={buttonVariants("secondary", "lg")} href="/join">
              Spiel beitreten
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
            <Link className={buttonVariants("ghost", "sm")} href="/login">
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Einloggen
            </Link>
            <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">
              /
            </span>
            <Link className="font-semibold text-ink hover:text-felt dark:text-zinc-200" href="/register">
              Konto erstellen
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200/75 bg-slate-50/70 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Aktiver Zug</p>
                  <p className="text-xl font-semibold tracking-tight text-ink dark:text-zinc-50">
                    Anna
                  </p>
                </div>
                <Badge variant="success">Runde 4</Badge>
              </div>
            </div>
            <div className="grid gap-5 p-5">
              <div className="grid grid-cols-5 gap-2">
                {[6, 6, 6, 4, 3].map((value, index) => (
                  <div
                    className="grid aspect-square place-items-center rounded-lg border border-slate-200 bg-white/80 p-2 shadow-sm dark:border-white/10 dark:bg-white/5"
                    key={`${value}-${index}`}
                  >
                    <Dice className="max-w-16" value={value} />
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-zinc-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Kategorie</th>
                      <th className="px-4 py-3 text-right font-semibold">Anna</th>
                      <th className="px-4 py-3 text-right font-semibold">Ben</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {previewRows.map(([category, anna, ben]) => (
                      <tr className="bg-white/60 dark:bg-transparent" key={category}>
                        <td className="px-4 py-3 font-medium text-ink dark:text-zinc-100">
                          {category}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-400">
                          {anna}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-400">
                          {ben}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <Sparkles aria-hidden="true" className="mb-3 h-5 w-5 text-felt dark:text-emerald-300" />
              <p className="text-2xl font-semibold tracking-tight text-ink dark:text-zinc-50">13</p>
              <p className="text-sm text-slate-600 dark:text-zinc-400">Kategorien</p>
            </Card>
            <Card className="p-4">
              <UsersRound aria-hidden="true" className="mb-3 h-5 w-5 text-felt dark:text-emerald-300" />
              <p className="text-2xl font-semibold tracking-tight text-ink dark:text-zinc-50">2+</p>
              <p className="text-sm text-slate-600 dark:text-zinc-400">Spieler</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {qualityCards.map(([title, description]) => (
          <Card className="p-5" key={title}>
            <h2 className="mb-2 text-base font-semibold text-ink dark:text-zinc-50">{title}</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-zinc-400">{description}</p>
          </Card>
        ))}
      </section>
    </PageContainer>
  );
}

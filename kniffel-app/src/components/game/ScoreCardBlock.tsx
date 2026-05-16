import { Ban, CheckCircle2, Circle, LockKeyhole } from "lucide-react";

import {
  getFilledCategoryCount,
  getLowerSectionScore,
  getUpperSectionScore
} from "@/game/game-state";
import { scoreCategories, scoreCategoryLabels, upperScoreCategories } from "@/game/scorecard";
import type { GameStateScoreCard } from "@/game/state";
import type { ScoreCategory } from "@/game/types";
import { cn } from "@/lib/cn";

type ScoreCardBlockProps = {
  className?: string;
  compact?: boolean;
  scoreCard: GameStateScoreCard | null | undefined;
};

const upperScoreCategorySet = new Set<ScoreCategory>(upperScoreCategories);
const lowerScoreCategories = scoreCategories.filter((category) => !upperScoreCategorySet.has(category));
const upperCategoryDivisors: Partial<Record<ScoreCategory, number>> = {
  fives: 5,
  fours: 4,
  ones: 1,
  sixes: 6,
  threes: 3,
  twos: 2
};

function CategoryRow({
  category,
  compact = false,
  scoreCard
}: {
  category: ScoreCategory;
  compact?: boolean;
  scoreCard: GameStateScoreCard;
}) {
  const value = scoreCard[category];
  const open = value === null || value === undefined;
  const struck = !open && (scoreCard.struckCategories?.includes(category) ?? false);
  const divisor = upperCategoryDivisors[category];
  const displayedValue =
    !open && divisor && !struck ? `${value} (${Math.floor(value / divisor)})` : value;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-3 transition-colors",
        compact ? "min-h-9 py-1.5" : "min-h-11 py-2",
        struck
          ? "border border-rose-200/80 bg-rose-50/90 text-rose-900 dark:border-rose-300/15 dark:bg-rose-950/25 dark:text-rose-100"
          : open
          ? "bg-emerald-50/70 text-ink dark:bg-emerald-300/10 dark:text-zinc-50"
          : "bg-slate-100/80 text-slate-600 dark:bg-white/5 dark:text-zinc-400"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {struck ? (
          <Ban aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-300" />
        ) : open ? (
          <Circle aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
        ) : (
          <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
        )}
        <span
          className={cn(
            "truncate",
            open ? "font-semibold" : "font-medium",
            struck ? "text-rose-800 line-through decoration-2 decoration-rose-500/70 dark:text-rose-100" : ""
          )}
        >
          {scoreCategoryLabels[category]}
        </span>
        {struck ? (
          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-rose-700 dark:bg-rose-300/10 dark:text-rose-100">
            Gestrichen
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
          struck
            ? "bg-rose-100 text-rose-800 dark:bg-rose-300/10 dark:text-rose-100"
            : open
            ? "bg-white/80 text-emerald-700 dark:bg-white/10 dark:text-emerald-200"
            : "bg-white/80 text-slate-700 dark:bg-white/10 dark:text-zinc-300"
        )}
      >
        {open ? "frei" : displayedValue}
      </span>
    </div>
  );
}

function Section({
  categories,
  compact,
  scoreCard,
  title
}: {
  categories: readonly ScoreCategory[];
  compact?: boolean;
  scoreCard: GameStateScoreCard;
  title: string;
}) {
  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-200">{title}</h3>
        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500">
          {
            categories.filter(
              (category) => scoreCard[category] !== null && scoreCard[category] !== undefined
            ).length
          }
          /
          {categories.length}
        </span>
      </div>
      <div className="grid gap-1.5">
        {categories.map((category) => (
          <CategoryRow
            category={category}
            compact={compact}
            key={category}
            scoreCard={scoreCard}
          />
        ))}
      </div>
    </section>
  );
}

function UpperSubtotal({
  upperScore
}: {
  compact?: boolean;
  upperScore: number;
}) {
  const bonusReached = upperScore >= 63;
  const bonusHint = bonusReached ? "+35 Bonus" : `${63 - upperScore} bis Bonus`;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-1 pt-0.5 text-xs",
        bonusReached
          ? "text-amber-700 dark:text-amber-200"
          : "text-slate-500 dark:text-zinc-500"
      )}
    >
      <span>Zwischensumme oben</span>
      <span className="shrink-0 font-semibold tabular-nums">
        {upperScore} · {bonusHint}
      </span>
    </div>
  );
}

function TotalSubtotal({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-0.5 text-xs text-slate-500 dark:text-zinc-500">
      <span>Gesamtsumme</span>
      <span className="shrink-0 font-semibold tabular-nums">{total}</span>
    </div>
  );
}

export function ScoreCardBlock({ className, compact = false, scoreCard }: ScoreCardBlockProps) {
  if (!scoreCard) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
        Kein Block vorhanden.
      </div>
    );
  }

  const filledCount = getFilledCategoryCount(scoreCard);
  const upperScore = getUpperSectionScore(scoreCard);
  const lowerScore = getLowerSectionScore(scoreCard);
  const total = scoreCard.total ?? upperScore + lowerScore + (scoreCard.upperBonus ?? 0);

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-ink transition-all duration-300 dark:bg-white"
          style={{ width: `${(filledCount / scoreCategories.length) * 100}%` }}
        />
      </div>

      {scoreCard.upperBonus === 35 ? (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:bg-amber-300/10 dark:text-amber-100">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Oberer Bonus aktiv
        </div>
      ) : null}

      <Section
        categories={upperScoreCategories}
        compact={compact}
        scoreCard={scoreCard}
        title="Oberer Block"
      />
      <UpperSubtotal compact={compact} upperScore={upperScore} />
      <Section
        categories={lowerScoreCategories}
        compact={compact}
        scoreCard={scoreCard}
        title="Unterer Block"
      />
      <TotalSubtotal total={total} />
    </div>
  );
}

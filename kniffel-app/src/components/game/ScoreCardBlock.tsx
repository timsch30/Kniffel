import { Ban, CheckCircle2, Circle, LockKeyhole } from "lucide-react";

import type { ScoreSuggestion } from "@/game/scoring";
import {
  normalizeStruckCategories,
  scoreCategories,
  scoreCategoryLabels,
  upperScoreCategories
} from "@/game/scorecard";
import type { ScoreCard, ScoreCategory } from "@/game/types";
import { cn } from "@/lib/cn";

type ScoreCardBlockProps = {
  className?: string;
  compact?: boolean;
  onSelectCategory?: (category: ScoreCategory) => void;
  scoreCard: ScoreCard | null | undefined;
  scoreSuggestions?: ScoreSuggestion[];
  selectedCategory?: ScoreCategory | null;
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
  onSelectCategory,
  recommendedCategory,
  scoreCard,
  selectedCategory,
  suggestion
}: {
  category: ScoreCategory;
  compact?: boolean;
  onSelectCategory?: (category: ScoreCategory) => void;
  recommendedCategory?: ScoreCategory | null;
  scoreCard: ScoreCard;
  selectedCategory?: ScoreCategory | null;
  suggestion?: ScoreSuggestion;
}) {
  const value = scoreCard[category];
  const open = value === null || value === undefined;
  const struck = !open && normalizeStruckCategories(scoreCard.struckCategories).includes(category);
  const divisor = upperCategoryDivisors[category];
  const displayedValue =
    !open && divisor && !struck ? `${value} (${Math.floor(value / divisor)})` : value;
  const interactive = Boolean(onSelectCategory);
  const selectable = Boolean(interactive && open && suggestion && !suggestion.used);
  const selected = selectedCategory === category;
  const recommended = recommendedCategory === category;
  const suggestionIsStrike = suggestion?.action === "strike";
  const content = (
    <>
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
      <span className="flex shrink-0 items-center gap-1.5">
        {open && suggestion ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              recommended
                ? suggestionIsStrike
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-300/10 dark:text-rose-100"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-100"
                : suggestionIsStrike
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-300/10 dark:text-rose-100"
                  : "bg-white/80 text-emerald-700 dark:bg-white/10 dark:text-emerald-200"
            )}
          >
            {recommended ? "Tipp " : ""}
            {suggestion.score}
            {suggestionIsStrike ? " str." : " P"}
          </span>
        ) : null}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            struck
              ? "bg-rose-100 text-rose-800 dark:bg-rose-300/10 dark:text-rose-100"
              : open
                ? "bg-white/80 text-emerald-700 dark:bg-white/10 dark:text-emerald-200"
                : "bg-white/80 text-slate-700 dark:bg-white/10 dark:text-zinc-300"
          )}
        >
          {open ? (suggestion ? (selected ? "gewaehlt" : "frei") : "frei") : displayedValue}
        </span>
      </span>
    </>
  );

  if (interactive) {
    return (
      <button
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg px-3 text-left transition-colors disabled:cursor-not-allowed",
          compact ? "min-h-9 py-1.5" : "min-h-11 py-2",
          selected
            ? "border border-emerald-500 bg-emerald-50 text-ink ring-4 ring-emerald-500/15 dark:border-emerald-300/70 dark:bg-emerald-300/15 dark:text-zinc-50 dark:ring-emerald-300/15"
            : struck
              ? "border border-rose-200/80 bg-rose-50/90 text-rose-900 dark:border-rose-300/15 dark:bg-rose-950/25 dark:text-rose-100"
              : open
                ? selectable
                  ? "border border-emerald-200/80 bg-emerald-50/70 text-ink hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-300/15 dark:bg-emerald-300/10 dark:text-zinc-50 dark:hover:border-emerald-300/35"
                  : "border border-slate-200 bg-slate-50/70 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500"
                : "border border-slate-200 bg-slate-100/80 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
        )}
        disabled={!selectable}
        onClick={() => {
          if (selectable) {
            onSelectCategory?.(category);
          }
        }}
        type="button"
      >
        {content}
      </button>
    );
  }

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
      {content}
    </div>
  );
}

function Section({
  categories,
  compact,
  onSelectCategory,
  recommendedCategory,
  scoreCard,
  selectedCategory,
  suggestionsByCategory,
  title
}: {
  categories: readonly ScoreCategory[];
  compact?: boolean;
  onSelectCategory?: (category: ScoreCategory) => void;
  recommendedCategory?: ScoreCategory | null;
  scoreCard: ScoreCard;
  selectedCategory?: ScoreCategory | null;
  suggestionsByCategory?: Map<ScoreCategory, ScoreSuggestion>;
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
            onSelectCategory={onSelectCategory}
            recommendedCategory={recommendedCategory}
            scoreCard={scoreCard}
            selectedCategory={selectedCategory}
            suggestion={suggestionsByCategory?.get(category)}
          />
        ))}
      </div>
    </section>
  );
}

function UpperSubtotal({ upperScore }: { compact?: boolean; upperScore: number }) {
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
        {upperScore} - {bonusHint}
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

function getFilledCategoryCount(scoreCard: ScoreCard): number {
  return scoreCategories.filter(
    (category) => scoreCard[category] !== null && scoreCard[category] !== undefined
  ).length;
}

function getUpperSectionScore(scoreCard: ScoreCard): number {
  return upperScoreCategories.reduce((sum, category) => sum + (scoreCard[category] ?? 0), 0);
}

function getLowerSectionScore(scoreCard: ScoreCard): number {
  return lowerScoreCategories.reduce((sum, category) => sum + (scoreCard[category] ?? 0), 0);
}

export function ScoreCardBlock({
  className,
  compact = false,
  onSelectCategory,
  scoreCard,
  scoreSuggestions,
  selectedCategory
}: ScoreCardBlockProps) {
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
  const openSuggestions = scoreSuggestions?.filter((suggestion) => !suggestion.used) ?? [];
  const recommendedCategory =
    [...openSuggestions].sort((left, right) => {
      const priorityDifference = right.priority - left.priority;

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const scoreDifference = right.score - left.score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return scoreCategories.indexOf(left.category) - scoreCategories.indexOf(right.category);
    })[0]?.category ?? null;
  const suggestionsByCategory = new Map(
    scoreSuggestions?.map((suggestion) => [suggestion.category, suggestion]) ?? []
  );

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
        onSelectCategory={onSelectCategory}
        recommendedCategory={recommendedCategory}
        scoreCard={scoreCard}
        selectedCategory={selectedCategory}
        suggestionsByCategory={suggestionsByCategory}
        title="Oberer Block"
      />
      <UpperSubtotal compact={compact} upperScore={upperScore} />
      <Section
        categories={lowerScoreCategories}
        compact={compact}
        onSelectCategory={onSelectCategory}
        recommendedCategory={recommendedCategory}
        scoreCard={scoreCard}
        selectedCategory={selectedCategory}
        suggestionsByCategory={suggestionsByCategory}
        title="Unterer Block"
      />
      <TotalSubtotal total={total} />
    </div>
  );
}

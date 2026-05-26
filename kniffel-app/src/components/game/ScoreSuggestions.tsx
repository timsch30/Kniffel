"use client";

import { motion } from "framer-motion";
import { Ban, CheckCircle2, LockKeyhole, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import type { ScoreCard, ScoreCategory } from "@/game/types";
import {
  getAvailableScoreSuggestions,
  getRankedScoreSuggestions,
  isValidDiceValues
} from "@/game/scoring";

type ScoreSuggestionsProps = {
  diceValues: number[];
  onSelect: (category: ScoreCategory) => void;
  scoreCard: ScoreCard;
  selectedCategory: ScoreCategory | null;
};

export function ScoreSuggestions({
  diceValues,
  onSelect,
  scoreCard,
  selectedCategory
}: ScoreSuggestionsProps) {
  if (!isValidDiceValues(diceValues)) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
        Erst 5 Wuerfel waehlen. Danach werden passende freie Kategorien vorgeschlagen.
      </div>
    );
  }

  const suggestions = getAvailableScoreSuggestions(scoreCard, diceValues);
  const openSuggestions = getRankedScoreSuggestions(scoreCard, diceValues);
  const recommendedCategory = openSuggestions[0]?.category ?? null;
  const usedSuggestions = suggestions.filter((suggestion) => suggestion.used);

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-200">
        <Sparkles aria-hidden="true" className="h-4 w-4 text-felt dark:text-emerald-300" />
        Freie Optionen
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {openSuggestions.map((suggestion, index) => {
          const isSelected = selectedCategory === suggestion.category;
          const isRecommended = suggestion.category === recommendedCategory;
          const isStrike = suggestion.action === "strike";

          return (
            <motion.button
              aria-pressed={isSelected}
              className={[
                "relative flex min-h-16 items-center justify-between gap-3 overflow-hidden rounded-lg border px-4 py-3 text-left shadow-sm transition-all duration-200",
                isSelected
                  ? "border-felt bg-felt/10 text-ink ring-4 ring-felt/20 dark:border-emerald-300/70 dark:bg-emerald-300/10 dark:text-zinc-50 dark:ring-emerald-300/15"
                  : isRecommended
                    ? isStrike
                      ? "border-rose-300/80 bg-rose-50/95 text-ink shadow-[0_14px_38px_rgba(225,29,72,0.12)] hover:border-rose-400 hover:shadow-[0_18px_46px_rgba(225,29,72,0.16)] dark:border-rose-300/30 dark:bg-rose-950/30 dark:text-zinc-50"
                      : "border-amber-300/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(236,253,245,0.86))] text-ink shadow-[0_14px_38px_rgba(245,158,11,0.18)] hover:border-amber-400 hover:shadow-[0_18px_46px_rgba(245,158,11,0.22)] dark:border-amber-300/30 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.26),rgba(6,78,59,0.18))] dark:text-zinc-50"
                    : "border-slate-200 bg-white/90 text-ink hover:border-felt/40 hover:bg-white hover:shadow-[0_12px_32px_rgba(22,120,87,0.1)] dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:border-emerald-300/30 dark:hover:bg-white/10"
              ].join(" ")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025, duration: 0.18 }}
              key={suggestion.category}
              onClick={() => onSelect(suggestion.category)}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              {isRecommended ? (
                <motion.span
                  aria-hidden="true"
                  animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.03, 1] }}
                  className={[
                    "absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl",
                    isStrike ? "bg-rose-300/20 dark:bg-rose-200/10" : "bg-amber-300/25 dark:bg-amber-200/10"
                  ].join(" ")}
                  transition={{ duration: 2.8, repeat: 2, ease: "easeInOut" }}
                />
              ) : null}
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  {isRecommended ? (
                    <Star
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500 dark:fill-amber-300 dark:text-amber-300"
                    />
                  ) : null}
                  {isStrike ? (
                    <Ban
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300"
                    />
                  ) : null}
                  <span className="block truncate font-semibold">{suggestion.label}</span>
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                  {isSelected ? (
                    <>
                      <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                      Ausgewaehlt
                    </>
                  ) : isRecommended ? (
                    <Badge
                      className={
                        isStrike
                          ? "border-rose-300/60 bg-rose-100/80 text-rose-800 dark:border-rose-200/20 dark:bg-rose-200/10 dark:text-rose-100"
                          : "border-amber-300/60 bg-amber-100/80 text-amber-800 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100"
                      }
                    >
                      {isStrike ? "Streichen" : "Empfohlen"}
                    </Badge>
                  ) : (
                    isStrike ? "Streichoption" : "frei"
                  )}
                </span>
                {suggestion.reason ? (
                  <span className="mt-1 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-semibold text-slate-600 dark:bg-white/10 dark:text-zinc-300">
                    {suggestion.reason}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right text-lg font-semibold tabular-nums">
                {suggestion.score}
                <span className="block text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Punkte
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {usedSuggestions.length > 0 ? (
        <details className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
          <summary className="cursor-pointer text-sm font-semibold text-slate-600 dark:text-zinc-300">
            Belegte Kategorien
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {usedSuggestions.map((suggestion) => (
              <button
                className="flex min-h-12 cursor-not-allowed items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-left text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500"
                disabled
                key={suggestion.category}
                type="button"
              >
                <span className="flex items-center gap-2 font-medium">
                  <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />
                  {suggestion.label}
                </span>
                <span className="font-semibold tabular-nums">{suggestion.score}</span>
              </button>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

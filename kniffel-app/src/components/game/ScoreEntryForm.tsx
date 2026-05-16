"use client";

import { useEffect, useRef, useState } from "react";

import { Calculator, CheckCircle2, PencilLine, Save, Sparkles } from "lucide-react";

import { Dice } from "@/components/game/Dice";
import { DiceInput } from "@/components/game/DiceInput";
import { ScoreSuggestions } from "@/components/game/ScoreSuggestions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { scoreCategories, scoreCategoryLabels } from "@/game/scorecard";
import { calculateScoreForCategory, isValidDiceValues } from "@/game/scoring";
import type { ScoreCard, ScoreCategory } from "@/game/types";

type ScoreEntryFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialDiceValues?: number[];
  onlineRollMode?: boolean;
  onSaved?: () => void;
  scoreCard: ScoreCard;
};

type EntryMode = "dice" | "manual";

function isCategoryUsed(scoreCard: ScoreCard, category: ScoreCategory): boolean {
  return scoreCard[category] !== null && scoreCard[category] !== undefined;
}

export function ScoreEntryForm({
  action,
  initialDiceValues = [],
  onlineRollMode = false,
  onSaved,
  scoreCard
}: ScoreEntryFormProps) {
  const [diceValues, setDiceValues] = useState<number[]>(initialDiceValues);
  const [manualPoints, setManualPoints] = useState("");
  const [mode, setMode] = useState<EntryMode>("dice");
  const [selectedCategory, setSelectedCategory] = useState<ScoreCategory | null>(null);
  const suggestionsSectionRef = useRef<HTMLElement | null>(null);
  const previousDiceCountRef = useRef(0);
  const [heldDice, setHeldDice] = useState<boolean[]>([false, false, false, false, false]);
  const [rollCount, setRollCount] = useState(initialDiceValues.length === 5 ? 1 : 0);

  useEffect(() => {
    setDiceValues(initialDiceValues);
    setHeldDice([false, false, false, false, false]);
    setRollCount(initialDiceValues.length === 5 ? 1 : 0);
  }, [initialDiceValues]);

  function rollDice() {
    if (rollCount >= 3) {
      return;
    }

    setDiceValues((previous) => {
      const values = previous.length === 5 ? previous : [1, 1, 1, 1, 1];
      return values.map((value, index) => (heldDice[index] ? value : Math.floor(Math.random() * 6) + 1));
    });
    setRollCount((previous) => previous + 1);
  }

  function toggleHeld(index: number) {
    if (rollCount === 0) {
      return;
    }

    setHeldDice((previous) => previous.map((held, position) => (position === index ? !held : held)));
  }

  function handleModeChange(nextMode: EntryMode) {
    setMode(nextMode);
    setDiceValues([]);
    setManualPoints("");
    setSelectedCategory(null);
  }

  async function submit(formData: FormData) {
    await action(formData);
    onSaved?.();
  }

  const parsedManualPoints = Number(manualPoints);
  const manualPointsValid =
    manualPoints !== "" &&
    Number.isInteger(parsedManualPoints) &&
    parsedManualPoints >= 0 &&
    parsedManualPoints <= 100;
  const canSubmit =
    selectedCategory !== null &&
    (mode === "dice" ? diceValues.length === 5 : manualPointsValid);
  const selectedLabel = selectedCategory ? scoreCategoryLabels[selectedCategory] : null;
  const selectedScore =
    selectedCategory && mode === "dice" && isValidDiceValues(diceValues)
      ? calculateScoreForCategory(selectedCategory, diceValues)
      : manualPointsValid
        ? parsedManualPoints
        : null;
  const selectedIsStrike = selectedScore === 0;

  useEffect(() => {
    const previousDiceCount = previousDiceCountRef.current;

    if (mode === "dice" && previousDiceCount < 5 && diceValues.length === 5) {
      suggestionsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    previousDiceCountRef.current = diceValues.length;
  }, [diceValues.length, mode]);

  return (
    <form action={submit} className="grid gap-5 pb-36">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/5">
        {([
          { icon: Calculator, id: "dice", label: "Wuerfel" },
          { icon: PencilLine, id: "manual", label: "Manuell" }
        ] as const).map((entryMode) => {
          const Icon = entryMode.icon;
          const active = mode === entryMode.id;

          return (
            <button
              aria-pressed={active}
              className={[
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                active
                  ? "bg-white text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-slate-500 hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-50"
              ].join(" ")}
              disabled={onlineRollMode && entryMode.id === "dice"}
              key={entryMode.id}
              onClick={() => handleModeChange(entryMode.id)}
              type="button"
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {entryMode.label}
            </button>
          );
        })}
      </div>

      {mode === "dice" ? (
        <section className="grid gap-5" ref={suggestionsSectionRef}>
          {onlineRollMode ? (
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Wurf {rollCount}/3</p>
              <div className="grid grid-cols-5 gap-2">
                {(diceValues.length === 5 ? diceValues : [1, 1, 1, 1, 1]).map((value, index) => (
                  <button
                    className={[
                      "rounded-xl border p-1",
                      heldDice[index] ? "border-amber-300" : "border-transparent"
                    ].join(" ")}
                    key={`${value}-${index}`}
                    onClick={() => toggleHeld(index)}
                    type="button"
                  >
                    <span className="sr-only">Wuerfel halten</span>
                    <Dice held={heldDice[index]} value={value} />
                  </button>
                ))}
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={rollCount >= 3}
                onClick={rollDice}
                type="button"
              >
                Wuerfeln
              </button>
            </div>
          ) : (
            <DiceInput onChange={setDiceValues} values={diceValues} />
          )}
          <ScoreSuggestions
            diceValues={diceValues}
            onSelect={setSelectedCategory}
            scoreCard={scoreCard}
            selectedCategory={selectedCategory}
          />
        </section>
      ) : (
        <section className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {scoreCategories.map((category) => {
              const used = isCategoryUsed(scoreCard, category);
              const selected = selectedCategory === category;

              return (
                <button
                  aria-pressed={selected}
                  className={[
                    "group relative flex min-h-14 items-center justify-between gap-3 overflow-hidden rounded-lg border px-4 py-3 text-left transition-all duration-200",
                    used
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500"
                      : "border-slate-200 bg-white/90 text-ink shadow-sm hover:-translate-y-0.5 hover:border-emerald-500/45 hover:bg-white hover:shadow-[0_14px_34px_rgba(15,23,42,0.1)] focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:border-emerald-300/45 dark:hover:bg-white/10",
                    selected
                      ? "border-emerald-600 bg-emerald-50 ring-4 ring-emerald-500/15 dark:border-emerald-300/70 dark:bg-emerald-300/15 dark:ring-emerald-300/15"
                      : ""
                  ].join(" ")}
                  disabled={used}
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-2 font-semibold">
                    {selected ? (
                      <CheckCircle2
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300"
                      />
                    ) : null}
                    <span className="truncate">{scoreCategoryLabels[category]}</span>
                  </span>
                  <span className="rounded-full border border-current/10 bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-zinc-400">
                    {used ? "belegt" : selected ? "ausgewaehlt" : "frei"}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="grid gap-2 text-sm font-medium text-slate-800 dark:text-zinc-200">
            Punkte
            <input
              className="min-h-12 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-base text-ink shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:focus:border-emerald-300 dark:focus:ring-emerald-300/10"
              inputMode="numeric"
              max={100}
              min={0}
              name="points"
              onChange={(event) => setManualPoints(event.target.value)}
              required
              step={1}
              type="number"
              value={manualPoints}
            />
          </label>
        </section>
      )}

      <input name="mode" type="hidden" value={mode} />
      <input name="category" type="hidden" value={selectedCategory ?? ""} />
      <input name="diceValues" type="hidden" value={JSON.stringify(diceValues)} />

      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_44px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-[0_-18px_44px_rgba(0,0,0,0.45)]">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
              Auswahl
            </p>
            <p className="truncate text-sm font-semibold text-ink dark:text-zinc-50">
              {selectedLabel
                ? `${selectedLabel}${
                    selectedScore !== null
                      ? selectedIsStrike
                        ? " - streichen"
                        : ` - ${selectedScore} Punkte`
                      : ""
                  }`
                : mode === "dice"
                  ? "5 Wuerfel waehlen"
                  : "Kategorie und Punkte waehlen"}
            </p>
          </div>
          <SubmitButton className="min-h-12 px-5" disabled={!canSubmit} pendingLabel="Speichert...">
            <Save aria-hidden="true" className="h-4 w-4" />
            Speichern
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

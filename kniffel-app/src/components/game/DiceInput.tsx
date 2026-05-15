"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";

import { Dice } from "@/components/game/Dice";
import { cn } from "@/lib/cn";

type DiceInputProps = {
  onChange: (diceValues: number[]) => void;
  values: number[];
};

const diceFaces = [1, 2, 3, 4, 5, 6];
const maxDiceCount = 5;

export function DiceInput({ onChange, values }: DiceInputProps) {
  const progress = (values.length / maxDiceCount) * 100;

  function addValue(value: number) {
    if (values.length >= maxDiceCount) {
      return;
    }

    onChange([...values, value]);
  }

  function removeValue(indexToRemove: number) {
    onChange(values.filter((_, index) => index !== indexToRemove));
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium text-slate-700 dark:text-zinc-300">
            {values.length} von {maxDiceCount} Wuerfeln gewaehlt
          </p>
          <button
            className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-950/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
            disabled={values.length === 0}
            onClick={() => onChange([])}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Zuruecksetzen
          </button>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-300"
            initial={false}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {diceFaces.map((value) => (
          <motion.button
            aria-label={`Augenzahl ${value} waehlen`}
            className="group grid aspect-square min-h-20 place-items-center rounded-xl border border-slate-200 bg-white/85 p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/45 hover:bg-white hover:shadow-[0_16px_38px_rgba(4,120,87,0.18)] focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-300/40 dark:hover:bg-white/10 dark:hover:shadow-[0_16px_38px_rgba(16,185,129,0.12)]"
            disabled={values.length >= maxDiceCount}
            key={value}
            onClick={() => addValue(value)}
            type="button"
            whileHover={{ y: values.length >= maxDiceCount ? 0 : -2 }}
            whileTap={{ scale: values.length >= maxDiceCount ? 1 : 0.98 }}
          >
            <Dice
              className="max-w-[4.5rem] group-hover:rotate-[-2deg] group-hover:scale-[1.03]"
              value={value}
            />
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2" aria-label="Ausgewaehlte Wuerfel" aria-live="polite">
        {Array.from({ length: maxDiceCount }).map((_, index) => {
          const value = values[index];

          return (
            <div
              className={cn(
                "grid aspect-square min-h-14 place-items-center rounded-lg border border-dashed",
                value
                  ? "border-amber-300/60 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10"
                  : "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/5"
              )}
              key={index}
            >
              <AnimatePresence initial={false}>
                {value ? (
                  <motion.button
                    aria-label={`Wuerfel ${value} entfernen`}
                    className="group relative grid h-full w-full place-items-center p-1"
                    exit={{ opacity: 0, scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    onClick={() => removeValue(index)}
                    title="Wert entfernen"
                    type="button"
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Dice className="max-w-14" held value={value} />
                    <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white dark:text-zinc-950">
                      <X aria-hidden="true" className="h-3 w-3" />
                    </span>
                  </motion.button>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Calculator, CheckCircle2, PencilLine, Save, SlidersHorizontal, Sparkles } from "lucide-react";

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
type MotionPermissionStatus =
  | "denied"
  | "granted"
  | "needs-permission"
  | "needs-secure-context"
  | "unsupported";
type MotionSample = {
  x: number;
  y: number;
  z: number;
};
type DeviceMotionEventConstructorWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

const EMPTY_DICE_VALUES: number[] = [];
const DICE_COUNT = 5;
const INITIAL_HELD_DICE = [false, false, false, false, false];
const SHAKE_THRESHOLDS: Record<number, number> = {
  1: 34,
  2: 28,
  3: 23,
  4: 18,
  5: 13
};
const ROLL_ANIMATION_INTERVAL_MS = 120;
const ROLL_ANIMATION_DURATION_MS = 950;

function createRandomDiceValues() {
  return Array.from({ length: DICE_COUNT }, () => Math.floor(Math.random() * 6) + 1);
}

function getMotionSample(event: DeviceMotionEvent): MotionSample | null {
  const acceleration = event.acceleration;

  if (
    acceleration &&
    acceleration.x !== null &&
    acceleration.y !== null &&
    acceleration.z !== null
  ) {
    return {
      x: acceleration.x,
      y: acceleration.y,
      z: acceleration.z
    };
  }

  const accelerationIncludingGravity = event.accelerationIncludingGravity;

  if (
    !accelerationIncludingGravity ||
    accelerationIncludingGravity.x === null ||
    accelerationIncludingGravity.y === null ||
    accelerationIncludingGravity.z === null
  ) {
    return null;
  }

  return {
    x: accelerationIncludingGravity.x,
    y: accelerationIncludingGravity.y,
    z: accelerationIncludingGravity.z
  };
}

function getMotionDelta(current: MotionSample, previous: MotionSample | null) {
  if (!previous) {
    return 0;
  }

  return Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y) + Math.abs(current.z - previous.z);
}

function isCategoryUsed(scoreCard: ScoreCard, category: ScoreCategory): boolean {
  return scoreCard[category] !== null && scoreCard[category] !== undefined;
}

export function ScoreEntryForm({
  action,
  initialDiceValues = EMPTY_DICE_VALUES,
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
  const lastShakeAtRef = useRef(0);
  const previousMotionSampleRef = useRef<MotionSample | null>(null);
  const rollAnimationRef = useRef<number | null>(null);
  const rollFinishRef = useRef<number | null>(null);
  const [heldDice, setHeldDice] = useState<boolean[]>(INITIAL_HELD_DICE);
  const [isRolling, setIsRolling] = useState(false);
  const [motionPermission, setMotionPermission] = useState<MotionPermissionStatus>("unsupported");
  const [rollingDiceValues, setRollingDiceValues] = useState<number[]>([]);
  const [rollCount, setRollCount] = useState(initialDiceValues.length === 5 ? 1 : 0);
  const [shakeSensitivity, setShakeSensitivity] = useState(2);

  useEffect(() => {
    setDiceValues((previous) => {
      if (
        previous.length === initialDiceValues.length &&
        previous.every((value, index) => value === initialDiceValues[index])
      ) {
        return previous;
      }

      return initialDiceValues;
    });
    setHeldDice((previous) => (previous.every((held) => !held) ? previous : INITIAL_HELD_DICE));
    setRollingDiceValues([]);
    setIsRolling(false);
    setRollCount((previous) => {
      const nextRollCount = initialDiceValues.length === 5 ? 1 : 0;
      return previous === nextRollCount ? previous : nextRollCount;
    });
  }, [initialDiceValues]);

  const rollDice = useCallback(() => {
    if (isRolling || rollCount >= 3) {
      return;
    }

    setIsRolling(true);

    const buildNextValues = (previous: number[]) => {
      const values = previous.length === DICE_COUNT ? previous : createRandomDiceValues();
      return values.map((value, index) => (heldDice[index] ? value : Math.floor(Math.random() * 6) + 1));
    };

    setRollingDiceValues((previous) =>
      buildNextValues(diceValues.length === DICE_COUNT ? diceValues : previous)
    );

    rollAnimationRef.current = window.setInterval(() => {
      setRollingDiceValues((previous) =>
        buildNextValues(diceValues.length === DICE_COUNT ? diceValues : previous)
      );
    }, ROLL_ANIMATION_INTERVAL_MS);

    rollFinishRef.current = window.setTimeout(() => {
      if (rollAnimationRef.current !== null) {
        window.clearInterval(rollAnimationRef.current);
        rollAnimationRef.current = null;
      }

      setDiceValues((previous) => {
        const nextValues = buildNextValues(previous);
        setRollingDiceValues(nextValues);
        return nextValues;
      });
      setRollCount((previous) => previous + 1);
      setIsRolling(false);
    }, ROLL_ANIMATION_DURATION_MS);
  }, [diceValues, heldDice, isRolling, rollCount]);

  useEffect(() => {
    return () => {
      if (rollAnimationRef.current !== null) {
        window.clearInterval(rollAnimationRef.current);
      }

      if (rollFinishRef.current !== null) {
        window.clearTimeout(rollFinishRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!onlineRollMode) {
      return;
    }

    if (!window.isSecureContext) {
      setMotionPermission("needs-secure-context");
      return;
    }

    const MotionEventConstructor = window.DeviceMotionEvent as
      | DeviceMotionEventConstructorWithPermission
      | undefined;

    if (!MotionEventConstructor) {
      setMotionPermission("unsupported");
      return;
    }

    setMotionPermission(MotionEventConstructor.requestPermission ? "needs-permission" : "granted");
  }, [onlineRollMode]);

  async function requestMotionPermission() {
    if (!window.isSecureContext) {
      setMotionPermission("needs-secure-context");
      return;
    }

    const MotionEventConstructor = window.DeviceMotionEvent as
      | DeviceMotionEventConstructorWithPermission
      | undefined;

    if (!MotionEventConstructor) {
      setMotionPermission("unsupported");
      return;
    }

    if (!MotionEventConstructor.requestPermission) {
      setMotionPermission("granted");
      return;
    }

    try {
      const permission = await MotionEventConstructor.requestPermission();
      setMotionPermission(permission === "granted" ? "granted" : "denied");
    } catch {
      setMotionPermission("denied");
    }
  }

  function handleSensitivityChange(value: string) {
    const nextValue = Number(value);

    if (Number.isInteger(nextValue) && nextValue >= 1 && nextValue <= 5) {
      setShakeSensitivity(nextValue);
      previousMotionSampleRef.current = null;
    }
  }

  function toggleHeld(index: number) {
    if (rollCount === 0 || isRolling) {
      return;
    }

    setHeldDice((previous) => previous.map((held, position) => (position === index ? !held : held)));
  }

  useEffect(() => {
    if (!onlineRollMode || mode !== "dice" || motionPermission !== "granted") {
      previousMotionSampleRef.current = null;
      return;
    }

    function handleDeviceMotion(event: DeviceMotionEvent) {
      if (rollCount >= 3 || isRolling) {
        return;
      }

      const sample = getMotionSample(event);

      if (!sample) {
        return;
      }

      const delta = getMotionDelta(sample, previousMotionSampleRef.current);
      previousMotionSampleRef.current = sample;
      const now = Date.now();

      if (delta > SHAKE_THRESHOLDS[shakeSensitivity] && now - lastShakeAtRef.current > 1100) {
        lastShakeAtRef.current = now;
        rollDice();
      }
    }

    window.addEventListener("devicemotion", handleDeviceMotion);
    return () => window.removeEventListener("devicemotion", handleDeviceMotion);
  }, [isRolling, mode, motionPermission, onlineRollMode, rollCount, rollDice, shakeSensitivity]);

  const displayedDiceValues = isRolling
    ? rollingDiceValues
    : diceValues.length === DICE_COUNT
      ? diceValues
      : [];
  const diceSlots = Array.from({ length: DICE_COUNT }, (_, index) => displayedDiceValues[index] ?? null);
  const motionPermissionLabel =
    motionPermission === "granted"
      ? "Schuetteln aktiv"
      : motionPermission === "needs-permission"
        ? "Schuetteln erst aktivieren"
        : motionPermission === "needs-secure-context"
          ? "HTTPS fuer Schuetteln noetig"
        : motionPermission === "denied"
          ? "Bewegungssensor nicht freigegeben"
          : "Bewegungssensor nicht verfuegbar";
  const motionPermissionHint =
    motionPermission === "needs-secure-context"
      ? "Der Browser blockiert Bewegungssensoren ueber diese Verbindung. Oeffne die App per HTTPS oder direkt auf localhost."
      : motionPermission === "unsupported"
        ? "Dieses Geraet oder dieser Browser stellt keine Bewegungssensoren bereit."
        : motionPermission === "denied"
          ? "Die Berechtigung wurde abgelehnt. Aktiviere Bewegungssensoren im Browser oder versuche es erneut."
          : null;

  function handleModeChange(nextMode: EntryMode) {
    setMode(nextMode);
    setDiceValues([]);
    setManualPoints("");
    setSelectedCategory(null);
    setRollingDiceValues([]);
    setIsRolling(false);
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
    (mode === "dice" ? diceValues.length === 5 && !isRolling : manualPointsValid);
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

    if (
      mode === "dice" &&
      !onlineRollMode &&
      previousDiceCount < 5 &&
      diceValues.length === 5
    ) {
      suggestionsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    previousDiceCountRef.current = diceValues.length;
  }, [diceValues.length, mode, onlineRollMode]);

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
            <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Wurf {rollCount}/3
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {motionPermissionLabel}
                </p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {diceSlots.map((value, index) => (
                  <button
                    aria-pressed={heldDice[index]}
                    className={[
                      "rounded-xl border p-1 transition-all disabled:cursor-not-allowed",
                      heldDice[index] ? "border-amber-300" : "border-transparent",
                      isRolling && !heldDice[index] ? "motion-safe:animate-pulse" : ""
                    ].join(" ")}
                    disabled={rollCount === 0 || isRolling}
                    key={index}
                    onClick={() => toggleHeld(index)}
                    type="button"
                  >
                    <span className="sr-only">
                      {rollCount === 0 ? "Noch nicht gewuerfelt" : "Wuerfel halten"}
                    </span>
                    <Dice held={heldDice[index]} value={value} />
                  </button>
                ))}
              </div>
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
                <label className="grid gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  <span className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
                      Shake-Empfindlichkeit
                    </span>
                    <span>Stufe {shakeSensitivity}</span>
                  </span>
                  <input
                    className="w-full accent-emerald-600 dark:accent-emerald-300"
                    max={5}
                    min={1}
                    onChange={(event) => handleSensitivityChange(event.target.value)}
                    step={1}
                    type="range"
                    value={shakeSensitivity}
                  />
                </label>
                {motionPermission === "needs-permission" || motionPermission === "denied" ? (
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-white/10 dark:text-zinc-50 dark:hover:border-white/20"
                    onClick={requestMotionPermission}
                    type="button"
                  >
                    Schuetteln aktivieren
                  </button>
                ) : null}
                {motionPermissionHint ? (
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                    {motionPermissionHint}
                  </p>
                ) : null}
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950"
                disabled={rollCount >= 3 || isRolling}
                onClick={rollDice}
                type="button"
              >
                {isRolling ? "Wuerfelt..." : "Wuerfeln"}
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Calculator,
  CheckCircle2,
  Dices,
  LockKeyhole,
  PencilLine,
  Save,
  SlidersHorizontal,
  Sparkles,
  X
} from "lucide-react";

import { Dice } from "@/components/game/Dice";
import { DiceInput } from "@/components/game/DiceInput";
import { ScoreCardBlock } from "@/components/game/ScoreCardBlock";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { scoreCategories, scoreCategoryLabels } from "@/game/scorecard";
import {
  calculateScoreForCategory,
  getAvailableScoreSuggestions,
  getRankedScoreSuggestions,
  isValidDiceValues
} from "@/game/scoring";
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
  1: 55,
  2: 40,
  3: 28,
  4: 18,
  5: 10
};
const ROLL_ANIMATION_INTERVAL_MS = 120;
const ROLL_ANIMATION_DURATION_MS = 950;
const MOTION_PERMISSION_STORAGE_KEY = "kniffel-motion-permission-granted";

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
  const [confirmationCategory, setConfirmationCategory] = useState<ScoreCategory | null>(null);
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
  const shouldReduceMotion = useReducedMotion();

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

    if (window.localStorage.getItem(MOTION_PERMISSION_STORAGE_KEY) === "true") {
      setMotionPermission("granted");
      return;
    }

    setMotionPermission(MotionEventConstructor.requestPermission ? "needs-permission" : "granted");
  }, [onlineRollMode]);

  async function requestMotionPermission() {
    if (motionPermission === "granted") {
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

    if (!MotionEventConstructor.requestPermission) {
      window.localStorage.setItem(MOTION_PERMISSION_STORAGE_KEY, "true");
      setMotionPermission("granted");
      return;
    }

    try {
      const permission = await MotionEventConstructor.requestPermission();
      if (permission === "granted") {
        window.localStorage.setItem(MOTION_PERMISSION_STORAGE_KEY, "true");
      } else {
        window.localStorage.removeItem(MOTION_PERMISSION_STORAGE_KEY);
      }
      setMotionPermission(permission === "granted" ? "granted" : "denied");
    } catch {
      window.localStorage.removeItem(MOTION_PERMISSION_STORAGE_KEY);
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
    setConfirmationCategory(null);
    setRollingDiceValues([]);
    setIsRolling(false);
  }

  async function submit(formData: FormData) {
    await action(formData);
    onSaved?.();
  }

  function getDiceButtonAnimate(index: number, held: boolean) {
    if (shouldReduceMotion) {
      return { rotate: 0, scale: held ? 0.97 : 1, y: 0 };
    }

    if (isRolling && !held) {
      const direction = index % 2 === 0 ? 1 : -1;

      return {
        rotate: [0, 12 * direction, -10 * direction, 0],
        scale: [1, 1.08, 0.96, 1.02],
        y: [0, -12, 5, 0]
      };
    }

    return { rotate: 0, scale: held ? 0.96 : 1, y: 0 };
  }

  function getDiceButtonTransition(index: number, held: boolean) {
    if (shouldReduceMotion) {
      return { duration: 0.01 };
    }

    if (isRolling && !held) {
      return {
        delay: index * 0.035,
        duration: 0.48,
        ease: "easeInOut" as const,
        repeat: Infinity,
        repeatType: "mirror" as const
      };
    }

    return {
      damping: 24,
      mass: 0.75,
      stiffness: 520,
      type: "spring" as const
    };
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
  const validDiceValues = mode === "dice" && isValidDiceValues(diceValues);
  const canShowDiceRecommendation = validDiceValues && (!onlineRollMode || rollCount >= 3);
  const diceSuggestions = canShowDiceRecommendation
    ? getAvailableScoreSuggestions(scoreCard, diceValues)
    : undefined;
  const recommendedSuggestion =
    canShowDiceRecommendation ? getRankedScoreSuggestions(scoreCard, diceValues)[0] : undefined;
  const confirmationScore =
    confirmationCategory && validDiceValues
      ? calculateScoreForCategory(confirmationCategory, diceValues)
      : null;
  const confirmationLabel = confirmationCategory ? scoreCategoryLabels[confirmationCategory] : null;

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
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-white/[0.07] p-1">
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
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-semibold transition-all",
                active
                  ? "border border-brass/25 bg-white/[0.11] text-white shadow-sm"
                  : "text-emerald-50/55 hover:text-white"
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
            <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(22rem,1.15fr)] lg:items-start">
              <section className="relative grid gap-3 overflow-hidden rounded-lg border border-brass/20 bg-[linear-gradient(145deg,rgba(6,78,59,0.9),rgba(2,23,19,0.96))] p-3 shadow-[0_18px_58px_rgba(0,0,0,0.26)]">
                <motion.div
                  aria-hidden="true"
                  animate={
                    shouldReduceMotion
                      ? { backgroundPosition: "50% 50%" }
                      : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
                  }
                  className="absolute inset-0 opacity-40 [background-size:220%_220%] bg-[linear-gradient(120deg,rgba(255,255,255,0.18),transparent_32%,rgba(244,185,66,0.16),transparent_68%,rgba(16,185,129,0.16))]"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.01 }
                      : { duration: 7, ease: "easeInOut", repeat: Infinity }
                  }
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-50/80">
                      <Dices aria-hidden="true" className="h-3.5 w-3.5" />
                      Online-Wurf
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      Wurf {rollCount}/3
                    </p>
                  </div>
                  <button
                    aria-pressed={motionPermission === "granted"}
                    className={[
                      "inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition-all",
                      motionPermission === "granted"
                        ? "border-brass/35 bg-brass text-emerald-950 hover:bg-amber-300"
                        : "border-white/15 bg-white/10 text-emerald-50 hover:border-white/25 hover:bg-white/15"
                    ].join(" ")}
                    onClick={requestMotionPermission}
                    type="button"
                  >
                    Shake {motionPermission === "granted" ? "an" : "aktivieren"}
                  </button>
                </div>

                <div className="relative rounded-lg border border-white/15 bg-black/25 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-24px_48px_rgba(0,0,0,0.18)]">
                  <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
                    {diceSlots.map((value, index) => (
                      <motion.button
                        animate={getDiceButtonAnimate(index, heldDice[index])}
                        aria-label={
                          rollCount === 0
                            ? `Wuerfel ${index + 1}: noch nicht gewuerfelt`
                            : heldDice[index]
                              ? `Wuerfel ${index + 1}: ${value ?? ""}, gehalten. Freigeben`
                              : `Wuerfel ${index + 1}: ${value ?? ""}. Halten`
                        }
                        aria-pressed={heldDice[index]}
                        className={[
                          "relative aspect-square rounded-xl border p-0.5 transition-colors focus-visible:ring-4 focus-visible:ring-brass/40 disabled:cursor-not-allowed sm:p-1",
                          heldDice[index]
                            ? "border-brass/80 bg-amber-200/10 shadow-[0_12px_30px_rgba(244,185,66,0.24)]"
                            : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10",
                          isRolling && !heldDice[index] ? "z-10" : ""
                        ].join(" ")}
                        disabled={rollCount === 0 || isRolling}
                        key={index}
                        onClick={() => toggleHeld(index)}
                        transition={getDiceButtonTransition(index, heldDice[index])}
                        type="button"
                        whileTap={
                          shouldReduceMotion || rollCount === 0 || isRolling ? undefined : { scale: 0.94 }
                        }
                      >
                        <span className="sr-only">
                          {rollCount === 0 ? "Noch nicht gewuerfelt" : "Wuerfel halten"}
                        </span>
                        <Dice held={heldDice[index]} value={value} />
                        {heldDice[index] ? (
                          <span
                            aria-hidden="true"
                            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-amber-100/30 bg-amber-300/90 text-amber-950 shadow-sm"
                          >
                            <LockKeyhole className="h-3 w-3" />
                          </span>
                        ) : null}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <details className="relative rounded-lg border border-white/10 bg-white/[0.07] text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-emerald-50/75">
                    <span className="inline-flex items-center gap-1.5">
                      <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
                      Shake
                    </span>
                    <span className="text-emerald-50/60">Stufe {shakeSensitivity}</span>
                  </summary>
                  <div className="grid gap-3 border-t border-white/10 px-3 py-3">
                    <label className="grid gap-2 text-xs font-semibold text-emerald-50/80">
                      <span className="flex items-center justify-between gap-3">
                        <span>Empfindlichkeit</span>
                        <span className="text-emerald-50/80">Stufe {shakeSensitivity}</span>
                      </span>
                      <input
                        className="w-full accent-brass"
                        max={5}
                        min={1}
                        onChange={(event) => handleSensitivityChange(event.target.value)}
                        step={1}
                        type="range"
                        value={shakeSensitivity}
                      />
                    </label>
                    <p className="text-xs font-semibold text-emerald-50/65">
                      {motionPermissionLabel}
                    </p>
                  {motionPermissionHint ? (
                    <p className="text-xs font-medium text-emerald-50/75">
                      {motionPermissionHint}
                    </p>
                  ) : null}
                  </div>
                </details>
                <button
                  className="relative inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-brass/40 bg-brass px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                  disabled={rollCount >= 3 || isRolling}
                  onClick={rollDice}
                  type="button"
                >
                  <Dices aria-hidden="true" className="h-4 w-4" />
                  {isRolling ? "Wuerfelt..." : "Wuerfeln"}
                </button>
              </section>

              <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.08] p-3 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 px-1">
                  <h3 className="text-sm font-semibold text-white">Kniffel-Block</h3>
                  <span className="text-xs font-semibold text-emerald-50/60">
                    {validDiceValues ? "Feld klicken" : "erst wuerfeln"}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  {recommendedSuggestion ? (
                    <motion.button
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="flex items-center justify-between gap-3 rounded-lg border border-brass/35 bg-brass/[0.12] px-3 py-2 text-left shadow-sm"
                      exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98, y: 0 }}
                      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 6 }}
                      key={`${diceValues.join("-")}-${recommendedSuggestion.category}`}
                      onClick={() => {
                        if (isRolling) {
                          return;
                        }

                        setSelectedCategory(recommendedSuggestion.category);
                        setConfirmationCategory(recommendedSuggestion.category);
                      }}
                      transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.2 }}
                      type="button"
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-100">
                          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                          Beste Option
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-white">
                          {recommendedSuggestion.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-amber-100">
                        {recommendedSuggestion.score}
                        <span className="block text-[0.68rem] font-medium">
                          {recommendedSuggestion.action === "strike" ? "streichen" : "Punkte"}
                        </span>
                      </span>
                    </motion.button>
                  ) : null}
                </AnimatePresence>
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  key={validDiceValues ? diceValues.join("-") : "empty-scorecard"}
                  transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.18 }}
                >
                  <ScoreCardBlock
                    compact
                    onSelectCategory={(category) => {
                      if (!validDiceValues || isRolling) {
                        return;
                      }

                      setSelectedCategory(category);
                      setConfirmationCategory(category);
                    }}
                    scoreCard={scoreCard}
                    scoreSuggestions={diceSuggestions}
                    selectedCategory={selectedCategory}
                  />
                </motion.div>
              </section>
            </div>
          ) : (
            <div className="grid gap-4">
              <DiceInput onChange={setDiceValues} values={diceValues} />

              <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.08] p-3 text-white shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 px-1">
                  <h3 className="text-sm font-semibold text-white">Aktueller Block</h3>
                  <span className="text-xs font-semibold text-emerald-50/60">
                    {validDiceValues ? "Feld klicken" : "erst 5 Wuerfel waehlen"}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {recommendedSuggestion ? (
                    <motion.button
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-brass/35 bg-brass/[0.12] px-3 py-3 text-left shadow-sm"
                      exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98, y: 0 }}
                      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 6 }}
                      key={`${diceValues.join("-")}-${recommendedSuggestion.category}`}
                      onClick={() => {
                        setSelectedCategory(recommendedSuggestion.category);
                        setConfirmationCategory(recommendedSuggestion.category);
                      }}
                      transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.2 }}
                      type="button"
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-100">
                          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                          Empfehlung
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-white">
                          {recommendedSuggestion.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-amber-100">
                        {recommendedSuggestion.score}
                        <span className="block text-[0.68rem] font-medium">
                          {recommendedSuggestion.action === "strike" ? "streichen" : "Punkte"}
                        </span>
                      </span>
                    </motion.button>
                  ) : (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-dashed border-white/10 bg-white/[0.05] px-3 py-4 text-sm font-medium text-emerald-50/65"
                      exit={{ opacity: 0 }}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                      key="real-dice-empty-recommendation"
                      transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.16 }}
                    >
                      Erst 5 Wuerfel waehlen. Danach erscheint hier die beste Option.
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  key={validDiceValues ? diceValues.join("-") : "real-empty-scorecard"}
                  transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.18 }}
                >
                  <ScoreCardBlock
                    compact
                    onSelectCategory={(category) => {
                      if (!validDiceValues) {
                        return;
                      }

                      setSelectedCategory(category);
                      setConfirmationCategory(category);
                    }}
                    scoreCard={scoreCard}
                    scoreSuggestions={diceSuggestions}
                    selectedCategory={selectedCategory}
                  />
                </motion.div>
              </section>
            </div>
          )}
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
                      ? "cursor-not-allowed border-white/10 bg-white/[0.05] text-emerald-50/40"
                      : "border-white/10 bg-white/[0.08] text-emerald-50 shadow-sm hover:-translate-y-0.5 hover:border-emerald-300/45 hover:bg-white/[0.12] focus-visible:ring-4 focus-visible:ring-brass/25",
                    selected
                      ? "border-brass/70 bg-brass/[0.14] ring-4 ring-brass/15"
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
                        className="h-4 w-4 shrink-0 text-brass"
                      />
                    ) : null}
                    <span className="truncate">{scoreCategoryLabels[category]}</span>
                  </span>
                  <span className="rounded-full border border-current/10 bg-white/[0.07] px-2 py-0.5 text-xs font-semibold text-emerald-50/60">
                    {used ? "belegt" : selected ? "ausgewaehlt" : "frei"}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="grid gap-2 text-sm font-medium text-emerald-50/85">
            Punkte
            <input
              className="min-h-12 rounded-lg border border-white/10 bg-black/15 px-4 py-3 text-base text-white shadow-sm outline-none transition-all placeholder:text-emerald-50/40 focus:border-brass/70 focus:ring-4 focus:ring-brass/15"
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
      <input name="category" type="hidden" value={confirmationCategory ?? selectedCategory ?? ""} />
      <input name="diceValues" type="hidden" value={JSON.stringify(diceValues)} />

      {confirmationCategory && confirmationLabel ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/45 p-4">
          <div
            aria-modal="true"
            className="w-full max-w-md rounded-lg border border-brass/25 bg-[linear-gradient(145deg,rgba(6,78,59,0.96),rgba(2,23,19,0.96))] p-4 text-white shadow-xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-brass">
                  Eintrag bestaetigen
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">{confirmationLabel}</h3>
              </div>
              <button
                aria-label="Bestaetigung schliessen"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-emerald-50/75 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => setConfirmationCategory(null)}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-emerald-50/70">
              {confirmationScore === 0
                ? "Dieses Feld wird mit 0 Punkten gestrichen."
                : `${confirmationScore ?? 0} Punkte in dieses Feld eintragen.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-emerald-50 transition-colors hover:bg-white/[0.13]"
                onClick={() => setConfirmationCategory(null)}
                type="button"
              >
                Abbrechen
              </button>
              <SubmitButton
                className="min-h-11 px-4"
                disabled={!validDiceValues || isRolling}
                pendingLabel="Speichert..."
              >
                <Save aria-hidden="true" className="h-4 w-4" />
                Bestaetigen
              </SubmitButton>
            </div>
          </div>
        </div>
      ) : null}

      {!(onlineRollMode && mode === "dice") ? (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-emerald-950/92 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_44px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-50/60">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-brass" />
                Auswahl
              </p>
              <p className="truncate text-sm font-semibold text-white">
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
      ) : null}
    </form>
  );
}

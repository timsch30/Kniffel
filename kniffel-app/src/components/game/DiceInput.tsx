"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, RotateCcw, X } from "lucide-react";

import { Dice } from "@/components/game/Dice";
import { scanDice } from "@/lib/dice-vision";
import { cn } from "@/lib/cn";

type DiceInputProps = {
  onChange: (diceValues: number[]) => void;
  values: number[];
};

const diceFaces = [1, 2, 3, 4, 5, 6];
const maxDiceCount = 5;

export function DiceInput({ onChange, values }: DiceInputProps) {
  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<number[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stableFramesRef = useRef<number[][]>([]);
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

  const closeScanner = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanOpen(false);
    stableFramesRef.current = [];
    setScanProgress(0);
  }, []);

  useEffect(() => {
    if (!scanOpen) {
      return;
    }

    let cancelled = false;
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } }
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setScanError("Kamera konnte nicht gestartet werden.");
      }
    }

    setScanError(null);
    setScanResult([]);
    setScanProgress(0);
    stableFramesRef.current = [];
    setupCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [scanOpen]);

  const detectDiceValuesFromFrame = useCallback((imageData: ImageData): number[] | null => {
    const detections = scanDice(imageData).filter((die) => die.value !== null);
    if (detections.length === 0) {
      return null;
    }

    const reliable = detections.filter((die) => die.isReliable && die.value !== null);
    const source = reliable.length > 0 ? reliable : detections;
    const values = source
      .map((die) => die.value)
      .filter((value): value is number => value !== null)
      .slice(0, maxDiceCount)
      .sort((a, b) => a - b);

    if (values.length < 1 || values.length > maxDiceCount) {
      return null;
    }

    return values;
  }, []);

  const scanCurrentFrame = useCallback((): number[] | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setScanError("Kein Kamerabild verfuegbar.");
      return null;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      setScanError("Scan nicht verfuegbar.");
      return null;
    }
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const sx = 0;
    const sy = 0;
    canvas.width = 480;
    canvas.height = 360;
    context.drawImage(video, sx, sy, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const detectedValues = detectDiceValuesFromFrame(frame);
    if (!detectedValues) {
      setScanError("Bitte alle 5 Wuerfel gut sichtbar im Kamerabild platzieren.");
      setScanResult([]);
      stableFramesRef.current = [];
      setScanProgress(0);
      return null;
    }

    setScanError(null);
    setScanResult(detectedValues);
    return detectedValues;
  }, [detectDiceValuesFromFrame]);

  useEffect(() => {
    if (!scanOpen) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const detectedValues = scanCurrentFrame();
      if (!detectedValues || detectedValues.length < 1 || detectedValues.length > maxDiceCount) {
        return;
      }

      stableFramesRef.current = [...stableFramesRef.current, detectedValues].slice(-6);

      if (stableFramesRef.current.length < 3) {
        setScanProgress(Math.min(60, stableFramesRef.current.length * 20));
        return;
      }

      const targetCount = detectedValues.length;
      const comparableFrames = stableFramesRef.current.filter((frame) => frame.length === targetCount);
      if (comparableFrames.length < 3) {
        setScanProgress(70);
        return;
      }

      const votedValues = Array.from({ length: targetCount }).map((_, slotIndex) => {
        const counts = new Map<number, number>();
        for (const frame of comparableFrames) {
          const value = frame[slotIndex];
          counts.set(value, (counts.get(value) ?? 0) + 1);
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
      });

      const consensusReached = votedValues.every((value, slotIndex) => {
        let matches = 0;
        for (const frame of comparableFrames) {
          if (frame[slotIndex] === value) {
            matches += 1;
          }
        }
        return matches >= 3;
      });

      if (!consensusReached) {
        setScanProgress(80);
        return;
      }

      setScanProgress(100);
      onChange(votedValues.sort((a, b) => a - b));
      closeScanner();
    }, 800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [closeScanner, onChange, scanCurrentFrame, scanOpen]);

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
          <button
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            disabled={values.length >= maxDiceCount}
            onClick={() => setScanOpen(true)}
            type="button"
          >
            <Camera aria-hidden="true" className="h-3.5 w-3.5" />
            Mit Kamera scannen
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

      <AnimatePresence>
        {scanOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[95] bg-black/70 p-4"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <div className="mx-auto grid max-w-md gap-3 rounded-xl bg-white p-4 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink dark:text-zinc-50">Wuerfel scannen</p>
                <button className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-white/10" onClick={closeScanner} type="button">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
                <video autoPlay className="aspect-square w-full bg-slate-950 object-cover" playsInline ref={videoRef} />
              </div>
              <canvas className="hidden" ref={canvasRef} />
              {scanResult.length >= 1 ? (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Erkannt: {scanResult.join(" - ")}
                </p>
              ) : null}
              {scanError ? (
                <p className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <CameraOff className="h-3.5 w-3.5" />
                  {scanError}
                </p>
              ) : null}
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <motion.div
                  animate={{ width: `${scanProgress}%` }}
                  className="h-full rounded-full bg-emerald-600 dark:bg-emerald-300"
                  initial={false}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Halte alle 5 Wuerfel im Bild, wie sie gefallen sind. Wir erkennen Position und Wert automatisch.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

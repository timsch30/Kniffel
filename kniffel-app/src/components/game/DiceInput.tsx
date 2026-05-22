"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, RotateCcw, X } from "lucide-react";

import { Dice } from "@/components/game/Dice";
import { cn } from "@/lib/cn";
import { debugDraw, scanDice } from "@/lib/dice-vision";

type DiceInputProps = {
  onChange: (diceValues: number[]) => void;
  values: number[];
};

const diceFaces = [1, 2, 3, 4, 5, 6];
const maxDiceCount = 5;
const VISION_DEBUG = false;
const STABLE_FRAME_COUNT = 4;

export function DiceInput({ onChange, values }: DiceInputProps) {
  const progress = (values.length / maxDiceCount) * 100;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<string>("Bereit");
  const [history, setHistory] = useState<string[]>([]);

  function addValue(value: number) {
    if (values.length >= maxDiceCount) return;
    onChange([...values, value]);
  }

  function removeValue(indexToRemove: number) {
    onChange(values.filter((_, index) => index !== indexToRemove));
  }

  async function startScanner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScannerOpen(true);
      setScannerStatus("Suche Wuerfel...");
      setHistory([]);
    } catch {
      setScannerStatus("Kamera konnte nicht gestartet werden.");
    }
  }

  function stopScanner() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScannerOpen(false);
  }

  useEffect(() => () => stopScanner(), []);

  const stableValues = useMemo(() => {
    if (history.length < STABLE_FRAME_COUNT) return null;
    const recent = history.slice(-STABLE_FRAME_COUNT);
    const first = recent[0];
    if (first && recent.every((entry) => entry === first)) {
      return first.split(",").map((v) => Number(v));
    }
    return null;
  }, [history]);

  useEffect(() => {
    if (!scannerOpen || !videoRef.current || !canvasRef.current) return;

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const detections = scanDice(frame);
      const reliable = detections.filter((d) => d.isReliable && d.value !== null);
      const sortedValues = reliable.map((d) => d.value as number).sort((a, b) => a - b).slice(0, maxDiceCount);

      if (VISION_DEBUG && debugRef.current) {
        debugRef.current.width = canvas.width;
        debugRef.current.height = canvas.height;
        const dctx = debugRef.current.getContext("2d");
        if (dctx) {
          dctx.clearRect(0, 0, canvas.width, canvas.height);
          dctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          debugDraw(dctx, detections);
        }
      }

      if (sortedValues.length >= 1) {
        setHistory((prev) => [...prev.slice(-8), sortedValues.join(",")]);
        setScannerStatus(`Erkannt: ${sortedValues.join(", ")}`);
      } else {
        setScannerStatus("Unsicher: bitte Wuerfel besser ausleuchten / Kamera ruhiger halten.");
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scannerOpen]);

  useEffect(() => {
    if (!stableValues) return;
    onChange(stableValues);
    setScannerStatus(`Uebernommen: ${stableValues.join(", ")}`);
    stopScanner();
  }, [onChange, stableValues]);

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          onClick={startScanner}
          type="button"
        >
          <Camera className="h-4 w-4" /> Scanner starten
        </button>
        <p className="text-xs text-slate-500">{scannerStatus}</p>
      </div>

      {scannerOpen ? (
        <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
          <video className="w-full rounded" ref={videoRef} playsInline muted />
          {VISION_DEBUG ? <canvas className="w-full rounded" ref={debugRef} /> : null}
          <button className="rounded bg-slate-800 px-3 py-2 text-sm text-white" onClick={stopScanner} type="button">Scanner stoppen</button>
        </div>
      ) : null}
      <canvas className="hidden" ref={canvasRef} />

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium text-slate-700 dark:text-zinc-300">{values.length} von {maxDiceCount} Wuerfeln gewaehlt</p>
          <button
            className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-950/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
            disabled={values.length === 0}
            onClick={() => onChange([])}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Zuruecksetzen
          </button>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
          <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-emerald-600 dark:bg-emerald-300" initial={false} transition={{ duration: 0.22, ease: "easeOut" }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {diceFaces.map((value) => (
          <motion.button aria-label={`Augenzahl ${value} waehlen`} className="group grid aspect-square min-h-20 place-items-center rounded-xl border border-slate-200 bg-white/85 p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/45 hover:bg-white hover:shadow-[0_16px_38px_rgba(4,120,87,0.18)] focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-300/40 dark:hover:bg-white/10 dark:hover:shadow-[0_16px_38px_rgba(16,185,129,0.12)]" disabled={values.length >= maxDiceCount} key={value} onClick={() => addValue(value)} type="button" whileHover={{ y: values.length >= maxDiceCount ? 0 : -2 }} whileTap={{ scale: values.length >= maxDiceCount ? 1 : 0.98 }}>
            <Dice className="max-w-[4.5rem] group-hover:rotate-[-2deg] group-hover:scale-[1.03]" value={value} />
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2" aria-label="Ausgewaehlte Wuerfel" aria-live="polite">
        {Array.from({ length: maxDiceCount }).map((_, index) => {
          const value = values[index];
          return (
            <div className={cn("grid aspect-square min-h-14 place-items-center rounded-lg border border-dashed", value ? "border-amber-300/60 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10" : "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/5")} key={index}>
              <AnimatePresence initial={false}>
                {value ? (
                  <motion.button aria-label={`Wuerfel ${value} entfernen`} className="group relative grid h-full w-full place-items-center p-1" exit={{ opacity: 0, scale: 0.9 }} initial={{ opacity: 0, scale: 0.9 }} onClick={() => removeValue(index)} title="Wert entfernen" type="button" animate={{ opacity: 1, scale: 1 }}>
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

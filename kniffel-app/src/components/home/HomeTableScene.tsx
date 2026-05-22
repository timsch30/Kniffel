"use client";

import { useEffect, useMemo, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { Dice } from "@/components/game/Dice";

type RollingSide = "top" | "bottom";

const settledValues = [2, 5, 6];
const diceOffsets = [
  { rotate: -8, x: -58, y: -8 },
  { rotate: 10, x: 0, y: 12 },
  { rotate: -14, x: 58, y: -10 }
];

function randomDiceValues() {
  return Array.from({ length: settledValues.length }, () => Math.floor(Math.random() * 6) + 1);
}

export function HomeTableScene() {
  const shouldReduceMotion = useReducedMotion();
  const [rollingSide, setRollingSide] = useState<RollingSide>("top");
  const [rolling, setRolling] = useState(false);
  const [diceValues, setDiceValues] = useState(settledValues);

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    let valueInterval: number | null = null;
    const timeouts: number[] = [];

    function startRoll(side: RollingSide) {
      setRollingSide(side);
      setRolling(true);
      valueInterval = window.setInterval(() => setDiceValues(randomDiceValues()), 130);

      timeouts.push(
        window.setTimeout(() => {
          if (valueInterval !== null) {
            window.clearInterval(valueInterval);
            valueInterval = null;
          }

          setDiceValues(randomDiceValues());
          setRolling(false);
        }, 1250)
      );
    }

    startRoll("top");
    timeouts.push(
      window.setTimeout(() => startRoll("bottom"), 3600),
      window.setTimeout(() => startRoll("top"), 7200)
    );

    return () => {
      if (valueInterval !== null) {
        window.clearInterval(valueInterval);
      }

      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [shouldReduceMotion]);

  const clusterStart = useMemo(
    () =>
      rollingSide === "top"
        ? { left: "29%", top: "23%" }
        : { left: "72%", top: "78%" },
    [rollingSide]
  );

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-emerald-950">
      <motion.div
        animate={
          shouldReduceMotion
            ? { scale: 1 }
            : { scale: [1, 1.015, 1], x: ["0%", "1%", "0%"], y: ["0%", "-1%", "0%"] }
        }
        className="absolute left-1/2 top-1/2 h-[min(78rem,118vw)] w-[min(78rem,118vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[radial-gradient(circle_at_48%_45%,rgba(22,120,87,0.98),rgba(6,78,59,0.97)_48%,rgba(5,46,43,1)_72%)] shadow-[inset_0_2px_0_rgba(255,255,255,0.16),inset_0_-80px_140px_rgba(0,0,0,0.28),0_40px_120px_rgba(0,0,0,0.35)]"
        transition={
          shouldReduceMotion ? { duration: 0.01 } : { duration: 7, ease: "easeInOut" }
        }
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0,transparent_42%,rgba(2,6,23,0.48)_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(white_1px,transparent_1px)] [background-size:42px_42px]" />

      <motion.div
        animate={
          shouldReduceMotion
            ? { opacity: 0.55, scale: 1 }
            : rollingSide === "top"
              ? { opacity: [0.35, 0.72, 0.45], scale: [1, 1.03, 1] }
              : { opacity: 0.35, scale: 1 }
        }
        className="absolute left-[12%] top-[11%] h-28 w-52 rounded-lg border border-white/10 bg-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:h-32 sm:w-64"
        transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 1.2, ease: "easeInOut" }}
      >
        <div className="absolute left-5 top-5 h-12 w-12 rounded-full border border-white/10 bg-slate-900/35" />
        <div className="absolute bottom-5 right-5 grid grid-cols-3 gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((chip) => (
            <span className="h-5 w-5 rounded-full border border-brass/30 bg-brass/35" key={chip} />
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={
          shouldReduceMotion
            ? { opacity: 0.55, scale: 1 }
            : rollingSide === "bottom"
              ? { opacity: [0.35, 0.72, 0.45], scale: [1, 1.03, 1] }
              : { opacity: 0.35, scale: 1 }
        }
        className="absolute bottom-[10%] right-[10%] h-28 w-52 rounded-lg border border-white/10 bg-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:h-32 sm:w-64"
        transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 1.2, ease: "easeInOut" }}
      >
        <div className="absolute right-5 top-5 h-12 w-12 rounded-full border border-white/10 bg-slate-900/35" />
        <div className="absolute bottom-5 left-5 grid grid-cols-3 gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((chip) => (
            <span className="h-5 w-5 rounded-full border border-brass/30 bg-brass/35" key={chip} />
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={
          shouldReduceMotion
            ? { opacity: 0.18, scaleX: 1 }
            : rolling
              ? { opacity: [0, 0.45, 0], scaleX: [0.4, 1.05, 0.7] }
              : { opacity: 0.12, scaleX: 1 }
        }
        className="absolute left-1/2 top-1/2 h-px w-[min(34rem,72vw)] origin-center -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] bg-brass blur-[1px]"
        transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 1.25, ease: "easeOut" }}
      />

      {diceValues.map((value, index) => {
        const offset = diceOffsets[index];

        return (
          <motion.div
            animate={
              shouldReduceMotion
                ? {
                    left: "50%",
                    rotate: offset.rotate,
                    top: "50%",
                    x: `calc(-50% + ${offset.x}px)`,
                    y: `calc(-50% + ${offset.y}px)`
                  }
                : rolling
                  ? {
                      left: [clusterStart.left, "50%", "50%"],
                      rotate: [
                        offset.rotate,
                        offset.rotate + (rollingSide === "top" ? 135 : -135),
                        offset.rotate + (rollingSide === "top" ? 190 : -190)
                      ],
                      scale: [0.88, 1.08, 1],
                      top: [clusterStart.top, "50%", "50%"],
                      x: [
                        `calc(-50% + ${offset.x * 0.25}px)`,
                        `calc(-50% + ${offset.x * 0.7}px)`,
                        `calc(-50% + ${offset.x}px)`
                      ],
                      y: [
                        `calc(-50% + ${offset.y * 0.25}px)`,
                        `calc(-76% + ${offset.y * 0.45}px)`,
                        `calc(-50% + ${offset.y}px)`
                      ]
                    }
                  : {
                      left: "50%",
                      rotate: offset.rotate,
                      scale: 1,
                      top: "50%",
                      x: `calc(-50% + ${offset.x}px)`,
                      y: `calc(-50% + ${offset.y}px)`
                    }
            }
            className="absolute grid h-[clamp(3.5rem,9vw,5.4rem)] w-[clamp(3.5rem,9vw,5.4rem)] place-items-center rounded-lg border border-white/10 bg-white/10 p-2 shadow-[0_22px_48px_rgba(0,0,0,0.32)]"
            key={index}
            transition={
              shouldReduceMotion
                ? { duration: 0.01 }
                : rolling
                  ? { delay: index * 0.06, duration: 1.05, ease: [0.16, 0.9, 0.22, 1] }
                  : { damping: 22, stiffness: 300, type: "spring" }
            }
          >
            <Dice value={value} />
          </motion.div>
        );
      })}
    </div>
  );
}

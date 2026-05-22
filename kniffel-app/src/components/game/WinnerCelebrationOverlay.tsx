"use client";

import { motion, useReducedMotion } from "framer-motion";

const sparkles = [
  { delay: 0.05, left: "7%", size: 3, top: "26%", travel: -34 },
  { delay: 0.2, left: "13%", size: 5, top: "67%", travel: -48 },
  { delay: 0.35, left: "20%", size: 4, top: "42%", travel: -38 },
  { delay: 0.5, left: "27%", size: 7, top: "17%", travel: -46 },
  { delay: 0.65, left: "34%", size: 3, top: "78%", travel: -36 },
  { delay: 0.8, left: "42%", size: 5, top: "29%", travel: -44 },
  { delay: 0.95, left: "49%", size: 4, top: "58%", travel: -42 },
  { delay: 1.1, left: "56%", size: 8, top: "21%", travel: -50 },
  { delay: 1.25, left: "63%", size: 3, top: "74%", travel: -35 },
  { delay: 1.4, left: "70%", size: 6, top: "36%", travel: -48 },
  { delay: 1.55, left: "78%", size: 4, top: "62%", travel: -40 },
  { delay: 1.7, left: "86%", size: 7, top: "24%", travel: -52 },
  { delay: 1.85, left: "92%", size: 3, top: "48%", travel: -36 },
  { delay: 2, left: "17%", size: 4, top: "84%", travel: -44 },
  { delay: 2.15, left: "38%", size: 5, top: "88%", travel: -42 },
  { delay: 2.3, left: "61%", size: 4, top: "86%", travel: -38 },
  { delay: 2.45, left: "81%", size: 5, top: "82%", travel: -46 },
  { delay: 2.6, left: "45%", size: 3, top: "12%", travel: -30 }
];

export function WinnerCelebrationOverlay() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden mix-blend-screen"
      data-reduced-motion={shouldReduceMotion ? "true" : "false"}
      data-testid="winner-celebration-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: shouldReduceMotion ? 0.82 : 1 }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.7,
        ease: "easeOut"
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(244,185,66,0.26),transparent_28rem),radial-gradient(circle_at_50%_62%,var(--surface-strong),transparent_38rem)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.055),transparent)] bg-[length:10rem_100%] opacity-60" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brass/18 to-transparent" />
      <motion.div
        className="absolute left-1/2 top-[34%] h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass/35 blur-3xl sm:h-[38rem] sm:w-[38rem]"
        animate={
          shouldReduceMotion
            ? { opacity: 0.5 }
            : { opacity: [0.3, 0.68, 0.36], scale: [0.9, 1.16, 0.98] }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.01 }
            : { duration: 5.2, ease: "easeInOut", repeat: Infinity }
        }
      />
      <motion.div
        className="absolute left-1/2 top-[35%] h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass/45 shadow-[0_0_70px_rgba(244,185,66,0.24)] sm:h-96 sm:w-96"
        animate={
          shouldReduceMotion
            ? { opacity: 0.42 }
            : { opacity: [0, 0.64, 0.16], scale: [0.66, 1.26, 1.5] }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.01 }
            : { duration: 4.2, ease: "easeOut", repeat: Infinity, repeatDelay: 0.18 }
        }
      />
      <motion.div
        className="absolute left-1/2 top-[35%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 sm:h-[34rem] sm:w-[34rem]"
        animate={
          shouldReduceMotion
            ? { opacity: 0.24 }
            : { opacity: [0, 0.42, 0], scale: [0.78, 1.16, 1.38] }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.01 }
            : { delay: 0.8, duration: 5.6, ease: "easeOut", repeat: Infinity }
        }
      />
      <motion.div
        className="absolute left-1/2 top-[35%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass/20 sm:h-[48rem] sm:w-[48rem]"
        animate={
          shouldReduceMotion
            ? { opacity: 0.18 }
            : { opacity: [0.08, 0.3, 0.08], rotate: [0, 18, 0], scale: [0.98, 1.04, 0.98] }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.01 }
            : { duration: 8, ease: "easeInOut", repeat: Infinity }
        }
      />

      {!shouldReduceMotion
        ? sparkles.map((sparkle, index) => (
            <motion.span
              className="absolute rounded-full bg-brass text-brass shadow-[0_0_22px_currentColor]"
              key={`${sparkle.left}-${sparkle.top}`}
              style={{
                height: sparkle.size,
                left: sparkle.left,
                top: sparkle.top,
                width: sparkle.size
              }}
              initial={{ opacity: 0, scale: 0.3, y: 10 }}
              animate={{
                opacity: [0, 0.96, 0],
                scale: [0.35, 1.22, 0.6],
                y: [10, sparkle.travel]
              }}
              transition={{
                delay: sparkle.delay,
                duration: 3.2 + (index % 4) * 0.34,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 1.8 + (index % 5) * 0.28
              }}
            />
          ))
        : null}

      {!shouldReduceMotion ? (
        <>
          <motion.div
            className="absolute inset-x-0 top-[30%] h-px bg-gradient-to-r from-transparent via-brass/80 to-transparent"
            animate={{ opacity: [0.1, 0.72, 0.18], scaleX: [0.42, 1, 0.62] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-x-0 top-[47%] h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
            animate={{ opacity: [0, 0.48, 0], scaleX: [0.28, 1, 0.3] }}
            transition={{ delay: 1.1, duration: 5.2, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.div
            className="absolute left-1/2 top-[36%] h-[36rem] w-12 origin-center -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-brass/18 to-transparent blur-xl"
            animate={{ opacity: [0.08, 0.34, 0.08], rotate: [32, 52, 32] }}
            transition={{ duration: 7.2, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.div
            className="absolute left-1/2 top-[36%] h-[34rem] w-10 origin-center -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-white/14 to-transparent blur-xl"
            animate={{ opacity: [0.05, 0.28, 0.05], rotate: [-42, -62, -42] }}
            transition={{ delay: 1.8, duration: 8.4, ease: "easeInOut", repeat: Infinity }}
          />
        </>
      ) : null}
    </motion.div>
  );
}

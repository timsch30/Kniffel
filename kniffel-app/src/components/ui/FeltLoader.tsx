"use client";

import type { ReactNode } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";

type FeltLoaderProps = {
  className?: string;
  label?: string;
  variant?: "compact" | "dashboard" | "game";
};

function MiniDie({ delay = 0 }: { delay?: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      animate={shouldReduceMotion ? { opacity: 0.82 } : { opacity: [0.5, 1, 0.5], y: [0, -3, 0] }}
      className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-0.5 rounded-md border border-emerald-100/20 bg-[radial-gradient(circle_at_28%_18%,#34d399,#047857_52%,#052e2b)] p-1 shadow-[0_8px_18px_rgba(0,0,0,0.22)]"
      transition={
        shouldReduceMotion
          ? { duration: 0.01 }
          : { delay, duration: 0.9, ease: "easeInOut", repeat: Infinity }
      }
    >
      {[0, 1, 2, 3].map((pip) => (
        <span className="rounded-full bg-emerald-50" key={pip} />
      ))}
    </motion.span>
  );
}

function MiniDicePulse({ label = "Laedt" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-semibold text-emerald-50/80 shadow-sm backdrop-blur-xl">
      <span aria-hidden="true" className="flex items-center gap-1">
        <MiniDie delay={0} />
        <MiniDie delay={0.12} />
        <MiniDie delay={0.24} />
      </span>
      <span>{label}</span>
    </div>
  );
}

function FeltLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-3 rounded-full bg-[linear-gradient(110deg,rgba(255,255,255,0.07),rgba(244,185,66,0.18),rgba(255,255,255,0.07))] bg-[length:220%_100%] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] motion-safe:animate-shimmer",
        className
      )}
    />
  );
}

function FeltPanel({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-white/10 bg-white/[0.08] p-4 shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </section>
  );
}

function DashboardLoadingShape({ label }: { label?: string }) {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="grid flex-1 gap-2">
          <FeltLine className="h-4 w-32" />
          <FeltLine className="h-8 w-full max-w-lg" />
        </div>
        <MiniDicePulse label={label} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <FeltPanel className="grid gap-4" key={item}>
            <FeltLine className="h-4 w-28" />
            <FeltLine className="h-9 w-16" />
          </FeltPanel>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <FeltPanel className="grid gap-4" key={item}>
            <FeltLine className="h-7 w-2/3" />
            <FeltLine className="h-11 w-full" />
            <FeltLine className="h-11 w-full" />
            <FeltLine className="h-10 w-28" />
          </FeltPanel>
        ))}
      </div>
    </div>
  );
}

function GameLoadingShape({ label }: { label?: string }) {
  return (
    <div className="grid gap-5">
      <FeltPanel className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <FeltLine className="h-5 w-24" />
          <MiniDicePulse label={label} />
        </div>
        <FeltLine className="h-9 w-full max-w-md" />
        <div className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <FeltLine className="h-16" key={item} />
          ))}
        </div>
      </FeltPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <FeltLine className="h-12" />
          <FeltPanel className="grid gap-3">
            <FeltLine className="h-8 w-40" />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <FeltLine className="aspect-square h-auto rounded-lg" key={item} />
              ))}
            </div>
          </FeltPanel>
        </div>
        <aside className="grid content-start gap-4">
          {[0, 1, 2].map((item) => (
            <FeltPanel className="grid gap-3" key={item}>
              <FeltLine className="h-7 w-32" />
              <FeltLine className="h-12" />
              <FeltLine className="h-12" />
            </FeltPanel>
          ))}
        </aside>
      </section>
    </div>
  );
}

export function FeltLoader({
  className,
  label = "Laedt",
  variant = "compact"
}: FeltLoaderProps) {
  if (variant === "dashboard") {
    return <DashboardLoadingShape label={label} />;
  }

  if (variant === "game") {
    return <GameLoadingShape label={label} />;
  }

  return (
    <div className={cn("grid min-h-32 place-items-center py-8", className)} role="status">
      <MiniDicePulse label={label} />
    </div>
  );
}

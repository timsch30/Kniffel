import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
};

export function Card({ children, className, eyebrow, title, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/75 bg-white/90 p-5 shadow-card backdrop-blur-sm transition-colors dark:border-white/10 dark:bg-zinc-900/75 dark:shadow-card-dark",
        className
      )}
      {...props}
    >
      {eyebrow ? (
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-felt dark:text-emerald-300">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}

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
        "rounded-lg border border-white/10 bg-white/[0.08] p-5 text-white shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-colors",
        className
      )}
      {...props}
    >
      {eyebrow ? (
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brass">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}

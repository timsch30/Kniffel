import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "accent";

const variants: Record<BadgeVariant, string> = {
  accent:
    "border-brass/30 bg-brass/15 text-amber-100",
  danger:
    "border-red-300/20 bg-red-400/10 text-red-100",
  neutral:
    "border-white/10 bg-white/[0.07] text-emerald-50/80",
  success:
    "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  warning:
    "border-amber-300/20 bg-amber-300/10 text-amber-100"
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

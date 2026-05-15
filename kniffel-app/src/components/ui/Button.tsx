import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-semibold tracking-normal transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-felt focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 dark:focus-visible:ring-offset-zinc-950";

const variantStyles: Record<ButtonVariant, string> = {
  danger:
    "border-red-500/20 bg-red-600 text-white shadow-sm shadow-red-950/10 hover:bg-red-700 dark:border-red-400/20 dark:bg-red-500 dark:hover:bg-red-400",
  ghost:
    "border-transparent bg-transparent text-slate-700 hover:bg-slate-950/5 hover:text-ink dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
  primary:
    "border-transparent bg-ink text-white shadow-sm shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
  secondary:
    "border-slate-200/80 bg-white/80 text-ink shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:border-white/20 dark:hover:bg-white/10"
};

const sizeStyles: Record<ButtonSize, string> = {
  lg: "min-h-12 px-5 py-3 text-base",
  md: "min-h-10 px-4 py-2.5",
  sm: "min-h-9 px-3 py-2 text-xs"
};

export function buttonVariants(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md"
): string {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size]);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function Button({ className, size = "md", variant = "primary", ...props }: ButtonProps) {
  return <button className={cn(buttonVariants(variant, size), className)} {...props} />;
}

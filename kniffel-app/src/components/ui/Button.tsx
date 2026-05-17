import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-semibold tracking-normal transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100";

const variantStyles: Record<ButtonVariant, string> = {
  danger:
    "border-red-300/20 bg-red-500 text-white shadow-sm shadow-red-950/20 hover:bg-red-400",
  ghost:
    "border-transparent bg-transparent text-emerald-50/80 hover:bg-white/10 hover:text-white",
  primary:
    "border-brass/40 bg-brass text-emerald-950 shadow-sm shadow-black/20 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-md",
  secondary:
    "border-white/10 bg-white/[0.08] text-emerald-50 shadow-sm hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.13] hover:shadow-md"
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

import type { HTMLAttributes, ReactNode } from "react";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/cn";

type AlertVariant = "info" | "success" | "danger";

const variants: Record<AlertVariant, string> = {
  danger:
    "border-red-500/20 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-100",
  info:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200",
  success:
    "border-emerald-500/20 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
};

const icons: Record<AlertVariant, ReactNode> = {
  danger: <AlertCircle aria-hidden="true" className="h-4 w-4" />,
  info: <Info aria-hidden="true" className="h-4 w-4" />,
  success: <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
};

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

export function Alert({ children, className, variant = "info", ...props }: AlertProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium leading-6",
        variants[variant],
        className
      )}
      role={variant === "danger" ? "alert" : "status"}
      {...props}
    >
      <span className="mt-1 shrink-0">{icons[variant]}</span>
      <div>{children}</div>
    </div>
  );
}

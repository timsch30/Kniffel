import type { HTMLAttributes, ReactNode } from "react";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/cn";

type AlertVariant = "info" | "success" | "danger";

const variants: Record<AlertVariant, string> = {
  danger:
    "border-red-300/20 bg-red-400/10 text-red-100",
  info:
    "border-white/10 bg-white/[0.08] text-emerald-50/85",
  success:
    "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
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

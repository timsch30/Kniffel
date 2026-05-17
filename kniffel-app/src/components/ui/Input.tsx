import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  description?: string;
  label: string;
};

export function Input({ className, description, id, label, ...props }: InputProps) {
  const inputId = id ?? props.name;
  const descriptionId = description && inputId ? `${inputId}-description` : undefined;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-emerald-50/90" htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-describedby={descriptionId}
        id={inputId}
        className={cn(
          "min-h-11 rounded-lg border border-white/10 bg-black/15 px-3.5 py-2.5 text-base text-white shadow-sm outline-none transition-all duration-200 placeholder:text-emerald-50/40 hover:border-white/20 focus:border-brass/70 focus:ring-4 focus:ring-brass/15",
          className
        )}
        {...props}
      />
      {description ? (
        <p className="text-xs leading-5 text-emerald-50/70" id={descriptionId}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

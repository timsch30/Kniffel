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
      <label className="text-sm font-medium text-slate-800 dark:text-zinc-200" htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-describedby={descriptionId}
        id={inputId}
        className={cn(
          "min-h-11 rounded-lg border border-slate-200 bg-white/90 px-3.5 py-2.5 text-base text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-felt focus:ring-4 focus:ring-felt/20 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:hover:border-white/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10",
          className
        )}
        {...props}
      />
      {description ? (
        <p className="text-xs leading-5 text-slate-500 dark:text-zinc-400" id={descriptionId}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

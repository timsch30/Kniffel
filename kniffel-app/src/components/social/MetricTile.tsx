import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

type MetricTileProps = {
  className?: string;
  icon?: LucideIcon;
  label: string;
  value: string | number;
};

export function MetricTile({ className, icon: Icon, label, value }: MetricTileProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/75 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-slate-500 dark:text-zinc-400">
        <p className="text-xs font-medium">{label}</p>
        {Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
      </div>
      <p className="text-xl font-semibold tracking-tight text-ink dark:text-zinc-50">{value}</p>
    </div>
  );
}

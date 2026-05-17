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
        "min-w-0 rounded-lg border border-white/10 bg-black/15 px-3 py-3",
        className
      )}
    >
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2 text-emerald-50/70">
        <p className="min-w-0 truncate text-xs font-medium">{label}</p>
        {Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
      </div>
      <p className="min-w-0 truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
        {value}
      </p>
    </div>
  );
}

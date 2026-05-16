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
        "rounded-lg border border-white/10 bg-black/15 px-3 py-3",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-emerald-50/70">
        <p className="text-xs font-medium">{label}</p>
        {Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
      </div>
      <p className="text-xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

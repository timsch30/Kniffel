import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(110deg,rgba(255,255,255,0.08),rgba(255,255,255,0.18),rgba(255,255,255,0.08))] bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}

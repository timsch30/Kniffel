import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-lg bg-[linear-gradient(110deg,rgba(226,232,240,0.72),rgba(248,250,252,0.92),rgba(226,232,240,0.72))] bg-[length:200%_100%] animate-shimmer dark:bg-[linear-gradient(110deg,rgba(39,39,42,0.8),rgba(63,63,70,0.55),rgba(39,39,42,0.8))]",
        className
      )}
      {...props}
    />
  );
}

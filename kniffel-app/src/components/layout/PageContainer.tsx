import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes: Record<NonNullable<PageContainerProps["size"]>, string> = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl"
};

export function PageContainer({ children, className, size = "lg" }: PageContainerProps) {
  return (
    <main
      className={cn(
        "relative z-10 mx-auto w-full px-4 py-8 sm:px-6 sm:py-10 lg:py-12",
        sizes[size],
        className
      )}
    >
      {children}
    </main>
  );
}

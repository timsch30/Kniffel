import { cn } from "@/lib/cn";

type DiceProps = {
  className?: string;
  held?: boolean;
  value?: number | null;
};

const pipPositions: Record<number, string[]> = {
  1: ["col-start-2 row-start-2"],
  2: ["col-start-1 row-start-1", "col-start-3 row-start-3"],
  3: ["col-start-1 row-start-1", "col-start-2 row-start-2", "col-start-3 row-start-3"],
  4: [
    "col-start-1 row-start-1",
    "col-start-3 row-start-1",
    "col-start-1 row-start-3",
    "col-start-3 row-start-3"
  ],
  5: [
    "col-start-1 row-start-1",
    "col-start-3 row-start-1",
    "col-start-2 row-start-2",
    "col-start-1 row-start-3",
    "col-start-3 row-start-3"
  ],
  6: [
    "col-start-1 row-start-1",
    "col-start-3 row-start-1",
    "col-start-1 row-start-2",
    "col-start-3 row-start-2",
    "col-start-1 row-start-3",
    "col-start-3 row-start-3"
  ]
};

export function Dice({ className, held = false, value }: DiceProps) {
  const hasValue = typeof value === "number";

  return (
    <div
      aria-label={hasValue ? `Wuerfel ${value}${held ? ", gehalten" : ""}` : "Wuerfel noch nicht gewuerfelt"}
      className={cn(
        "relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl border p-[18%] shadow-sm transition-all duration-200",
        !hasValue
          ? "border-dashed border-slate-300 bg-slate-100 text-slate-400 shadow-none dark:border-white/10 dark:bg-white/5 dark:text-zinc-500"
          : held
          ? "border-amber-200/80 bg-[radial-gradient(circle_at_28%_18%,#fde68a,#f59e0b_48%,#92400e)] text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_14px_34px_rgba(245,158,11,0.3)] dark:border-amber-200/45 dark:bg-[radial-gradient(circle_at_28%_18%,#fbbf24,#b45309_52%,#451a03)] dark:text-amber-50"
          : "border-emerald-200/40 bg-[radial-gradient(circle_at_28%_18%,#34d399,#047857_48%,#052e2b)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_14px_32px_rgba(4,120,87,0.24)] dark:border-emerald-200/20 dark:bg-[radial-gradient(circle_at_28%_18%,#10b981,#065f46_52%,#021713)] dark:text-emerald-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_34px_rgba(0,0,0,0.42)]",
        className
      )}
    >
      {hasValue ? (
        <>
          <span aria-hidden="true" className="absolute inset-x-[14%] top-[11%] h-px bg-white/45" />
          <span aria-hidden="true" className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1">
            {(pipPositions[value] ?? pipPositions[1]).map((position, index) => (
              <span
                className={cn(
                  "h-[clamp(0.35rem,18%,0.78rem)] w-[clamp(0.35rem,18%,0.78rem)] self-center justify-self-center rounded-full bg-current shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_1px_3px_rgba(0,0,0,0.32)]",
                  position
                )}
                key={`${position}-${index}`}
              />
            ))}
          </span>
        </>
      ) : (
        <span aria-hidden="true" className="text-2xl font-semibold leading-none">
          -
        </span>
      )}
    </div>
  );
}

import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
};

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <Card className="grid justify-items-start gap-4 p-6">
      {icon ? (
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
          {icon}
        </div>
      ) : null}
      <div className="grid gap-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">{title}</h2>
        <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-zinc-400">{description}</p>
      </div>
      {action}
    </Card>
  );
}

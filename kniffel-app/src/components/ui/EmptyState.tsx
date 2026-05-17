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
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.08] text-emerald-50">
          {icon}
        </div>
      ) : null}
      <div className="grid gap-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="max-w-xl text-sm leading-6 text-emerald-50/70">{description}</p>
      </div>
      {action}
    </Card>
  );
}

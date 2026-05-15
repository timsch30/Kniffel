"use client";

import type { ReactNode } from "react";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";

type SubmitButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  className,
  disabled = false,
  pendingLabel = "Speichern..."
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button aria-live="polite" className={className} disabled={disabled || pending} type="submit">
      {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}

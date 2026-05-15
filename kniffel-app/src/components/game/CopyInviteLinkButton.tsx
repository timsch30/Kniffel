"use client";

import { useState } from "react";

import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/Button";

type CopyInviteLinkButtonProps = {
  inviteLink: string;
};

export function CopyInviteLinkButton({ inviteLink }: CopyInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard?.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button onClick={copyLink} type="button" variant={copied ? "primary" : "secondary"}>
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" />
      )}
      {copied ? "Kopiert" : "Link kopieren"}
    </Button>
  );
}

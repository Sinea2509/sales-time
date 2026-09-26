"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyTextButton({
  text,
  label,
  copiedLabel = "Copié",
  variant = "outline",
  size = "sm",
  className,
}: {
  text: string;
  label: string;
  copiedLabel?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const canCopy = text.trim().length > 0;

  const copy = useCallback(async () => {
    if (!canCopy) return;
    await navigator.clipboard.writeText(text.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [canCopy, text]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={!canCopy}
      className={cn(
        variant === "default" &&
          "bg-brand text-brand-foreground hover:bg-brand-hover",
        className,
      )}
      onClick={() => void copy()}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? copiedLabel : label}
    </Button>
  );
}

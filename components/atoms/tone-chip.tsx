import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipTone = "neutral" | "ok" | "warn" | "bad" | "info" | "brand";

/**
 * Les pastilles de la charte : un fond pâle, un liseré, une encre foncée
 * de la même famille. La couleur renforce un mot, elle ne le remplace pas.
 */
const TONE_CLASS: Readonly<Record<ChipTone, string>> = {
  neutral:
    "border-border bg-muted/60 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-300",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  bad: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  brand:
    "border-brand/30 bg-brand-soft text-brand-hover dark:border-brand/40 dark:text-brand-muted",
};

export function ToneChip({
  tone = "neutral",
  className,
  title,
  children,
}: {
  tone?: ChipTone;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

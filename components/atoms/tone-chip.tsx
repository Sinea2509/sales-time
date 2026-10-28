import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipTone = "neutral" | "ok" | "warn" | "bad" | "info" | "brand";

/**
 * Les pastilles de la charte 4 bis : un fond pastel sans liseré, une encre
 * foncée de la même famille (5,3:1 au moins). La couleur renforce un mot,
 * elle ne le remplace pas.
 */
const TONE_CLASS: Readonly<Record<ChipTone, string>> = {
  neutral:
    "border-transparent bg-muted text-muted-foreground dark:bg-zinc-800 dark:text-zinc-300",
  ok: "border-transparent bg-[#dcf4e8] text-[#12704a] dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warn: "border-transparent bg-[#ffebd9] text-[#8a4b00] dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  bad: "border-transparent bg-[#ffe2ec] text-[#a3243b] dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  info: "border-transparent bg-[#e7e9ff] text-[#3b3fb8] dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  brand:
    "border-transparent bg-brand-soft text-brand-hover dark:border-brand/40 dark:text-brand-muted",
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

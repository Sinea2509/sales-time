import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipTone = "neutral" | "ok" | "warn" | "bad" | "info" | "brand";

/** Le point de couleur devant le mot d'une pastille qui dit un état. */
const STATE_DOT =
  "before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']";

/**
 * Les pastilles de la charte 4 bis : un fond neutre, la couleur seulement sur
 * le mot et sur un point devant lui quand la pastille dit un état. Un fond de
 * couleur par pastille faisait trop de couleur (retour de Thomas du
 * 28 octobre 2026). Les encres tiennent 5,3:1 au moins sur le fond.
 */
const TONE_CLASS: Readonly<Record<ChipTone, string>> = {
  neutral: "bg-muted text-muted-foreground dark:bg-zinc-800 dark:text-zinc-300",
  ok: `${STATE_DOT} bg-muted text-[#12704a] dark:bg-zinc-800 dark:text-emerald-300`,
  warn: `${STATE_DOT} bg-muted text-[#8a4b00] dark:bg-zinc-800 dark:text-amber-300`,
  bad: `${STATE_DOT} bg-muted text-[#a3243b] dark:bg-zinc-800 dark:text-red-300`,
  info: `${STATE_DOT} bg-muted text-[#3b3fb8] dark:bg-zinc-800 dark:text-sky-300`,
  brand: "bg-brand-soft text-brand-hover dark:text-brand-muted",
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
        "inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

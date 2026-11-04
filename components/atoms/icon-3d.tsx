import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Icon3dTone = "violet" | "coral" | "amber" | "teal";

/*
  Direction artistique v13 : des pastilles à plat, teinte claire et icône
  colorée, comme les numéros de la landing. Le relief et les ombres colorées
  de la charte 4 bis disparaissent. Chaque encre tient 4,7:1 au moins sur sa
  teinte.
*/
const TONES: Record<Icon3dTone, string> = {
  violet: "bg-[#e6eaff] text-[#3d52d9] dark:bg-white/10 dark:text-[#9daeff]",
  coral: "bg-[#efe9ff] text-[#6a4fd9] dark:bg-white/10 dark:text-[#b59bff]",
  amber: "bg-[#fff1dd] text-[#8a4b00] dark:bg-white/10 dark:text-amber-300",
  teal: "bg-[#e3f6f1] text-[#0b6e5c] dark:bg-white/10 dark:text-emerald-300",
};

const SIZES = {
  sm: "size-8 rounded-full [&_svg]:size-4",
  md: "size-10 rounded-full [&_svg]:size-5",
  lg: "size-14 rounded-full [&_svg]:size-7",
} as const;

type Props = {
  children: ReactNode;
  tone?: Icon3dTone;
  size?: keyof typeof SIZES;
  className?: string;
};

/**
 * Une icône dans sa pastille. Elle était en relief depuis le 21 octobre 2026
 * (un onboarding moins froid) ; elle passe à plat avec la direction v13.
 */
export function Icon3d({
  children,
  tone = "violet",
  size = "md",
  className,
}: Props) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      <span className="relative flex">{children}</span>
    </span>
  );
}

/** L'ordre des teintes quand une liste d'icônes se suit. */
export const ICON_3D_TONE_CYCLE: readonly Icon3dTone[] = [
  "violet",
  "coral",
  "amber",
  "teal",
];

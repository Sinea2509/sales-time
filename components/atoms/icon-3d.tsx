import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Icon3dTone = "violet" | "coral" | "amber" | "teal";

const TONES: Record<Icon3dTone, string> = {
  violet:
    "from-[#B9A6FF] via-[#7B5CFF] to-[#4527D6] shadow-[inset_0_-3px_6px_rgba(20,0,90,0.35),inset_0_2px_2px_rgba(255,255,255,0.55),0_10px_18px_-8px_rgba(108,77,255,0.8)]",
  coral:
    "from-[#FFC2A8] via-[#FF7A6B] to-[#E0457A] shadow-[inset_0_-3px_6px_rgba(120,0,40,0.3),inset_0_2px_2px_rgba(255,255,255,0.55),0_10px_18px_-8px_rgba(255,110,100,0.8)]",
  amber:
    "from-[#FFE7A8] via-[#FFB547] to-[#EE7A1E] shadow-[inset_0_-3px_6px_rgba(120,50,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.6),0_10px_18px_-8px_rgba(255,170,60,0.8)]",
  teal: "from-[#A8F5E6] via-[#33D1B5] to-[#0E8C7C] shadow-[inset_0_-3px_6px_rgba(0,60,50,0.3),inset_0_2px_2px_rgba(255,255,255,0.55),0_10px_18px_-8px_rgba(40,200,170,0.8)]",
};

const SIZES = {
  sm: "size-8 rounded-lg [&_svg]:size-4",
  md: "size-10 rounded-xl [&_svg]:size-5",
  lg: "size-14 rounded-2xl [&_svg]:size-7",
} as const;

type Props = {
  children: ReactNode;
  tone?: Icon3dTone;
  size?: keyof typeof SIZES;
  className?: string;
};

/**
 * Une icône en relief : une pastille dégradée, éclairée par le haut, avec son
 * ombre colorée. Demande de Thomas du 21 octobre 2026 : un onboarding moins
 * froid, avec du relief.
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
        "relative inline-flex shrink-0 items-center justify-center bg-gradient-to-br text-white",
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[12%] top-[6%] h-[42%] rounded-[inherit] bg-gradient-to-b from-white/50 to-transparent"
      />
      <span className="relative flex drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
        {children}
      </span>
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

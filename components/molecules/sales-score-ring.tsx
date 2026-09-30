"use client";

import { AnimatedSalesScore } from "@/components/molecules/animated-sales-score";
import { cn } from "@/lib/utils";

/**
 * La couleur de l'anneau suit les paliers du produit : rouge en démarrage,
 * ambre en progression, violet en maîtrise, vert en excellence. Le chiffre
 * au centre porte l'information ; l'anneau la répète d'un coup d'œil.
 */
function ringColor(score: number | null): string {
  if (score == null) return "var(--muted-foreground)";
  if (score >= 80) return "#0E7A36";
  if (score >= 60) return "var(--brand)";
  if (score >= 40) return "#B4711A";
  return "#B3261E";
}

export function SalesScoreRing({
  score,
  pending = false,
  size = 104,
  stroke = 9,
  className,
}: {
  score: number | null;
  pending?: boolean;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke - 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - (score ?? 0) / 100);
  const label =
    score == null ? "SalesScore non calculé" : `SalesScore ${score} sur 100`;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} className="block -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center font-extrabold tracking-tight tabular-nums"
        style={{ fontSize: Math.round(size * 0.245) }}
        aria-hidden
      >
        <AnimatedSalesScore score={score} pending={pending} />
      </span>
    </div>
  );
}

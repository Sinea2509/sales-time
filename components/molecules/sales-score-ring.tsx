"use client";

import { useId } from "react";
import { AnimatedSalesScore } from "@/components/molecules/animated-sales-score";
import { cn } from "@/lib/utils";

/**
 * La couleur de l'anneau suit les paliers du produit : rouge en démarrage,
 * ambre en progression, bleu de marque en maîtrise, vert en excellence. Le
 * chiffre au centre porte l'information ; l'anneau la répète d'un coup d'œil,
 * en dégradé dans la teinte de son palier. Chaque teinte tient 3:1 sur blanc
 * comme sur la carte en bleu nuit.
 */
function ringGradient(score: number | null): readonly [string, string] {
  if (score == null) {
    return ["var(--muted-foreground)", "var(--muted-foreground)"];
  }
  if (score >= 80) return ["#0E7A36", "#1F9D57"];
  if (score >= 60) return ["var(--brand)", "var(--brand-deep)"];
  if (score >= 40) return ["#B4711A", "#C98216"];
  return ["#B3261E", "#D2453A"];
}

export function SalesScoreRing({
  score,
  pending = false,
  size = 104,
  stroke = 9,
  track = "var(--border)",
  className,
}: {
  score: number | null;
  pending?: boolean;
  size?: number;
  stroke?: number;
  /** Le fond de l'anneau : la bordure de la page, ou un blanc léger sur la nuit. */
  track?: string;
  className?: string;
}) {
  const gradientId = `anneau-${useId().replace(/[^\w-]/g, "")}`;
  const [from, to] = ringGradient(score);
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
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: from }} />
            <stop offset="100%" style={{ stopColor: to }} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
          className="st-ring transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
          style={{ "--st-ring-length": c.toFixed(1) } as React.CSSProperties}
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

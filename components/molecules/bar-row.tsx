import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Une ligne de barre : un nom à gauche, une jauge au milieu, une valeur à
 * droite. C'est la forme que la maquette donne aux SalesScores par
 * commercial et aux blocs de la grille : la même ligne pour les deux, si bien
 * qu'un manager lit les deux cartes de la même façon.
 */
export function BarRow({
  name,
  percent,
  value,
  color,
  title,
  className,
}: {
  name: ReactNode;
  /** Remplissage de la jauge, de 0 à 100. */
  percent: number;
  value: ReactNode;
  /** Couleur CSS de la jauge ; la marque par défaut. */
  color?: string;
  title?: string;
  className?: string;
}) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] items-center gap-3 py-1.5",
        className,
      )}
      title={title}
    >
      <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium">
        {name}
      </span>
      <span className="bg-border block h-[9px] overflow-hidden rounded-full">
        <span
          className="block h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${width}%`, background: color ?? "var(--brand)" }}
        />
      </span>
      <span className="min-w-[2.5rem] text-right text-[13px] font-bold tabular-nums">
        {value}
      </span>
    </div>
  );
}

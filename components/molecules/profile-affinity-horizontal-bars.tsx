type BarItem = {
  key: string;
  label: string;
  pct: number;
  /** Classes Tailwind pour le remplissage (ex. bg-red-600). */
  barClass: string;
};

function QuarterTicks() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden>
      <div className="absolute inset-y-0 left-[25%] w-px -translate-x-px bg-zinc-500/30 dark:bg-zinc-400/25" />
      <div className="absolute inset-y-0 left-[50%] w-px -translate-x-px bg-zinc-500/30 dark:bg-zinc-400/25" />
      <div className="absolute inset-y-0 left-[75%] w-px -translate-x-px bg-zinc-500/30 dark:bg-zinc-400/25" />
    </div>
  );
}

/**
 * Barres 0–100 % avec repères visuels à 25 / 50 / 75 %, une ligne par dimension (déjà triée).
 * Passez une grille « vide » (tous les % à 0) si aucune analyse n’est disponible.
 */
export function ProfileAffinityHorizontalBars({ items }: { items: BarItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((row) => (
        <li key={row.key}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-foreground text-sm font-medium">
              {row.label}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {row.pct}%
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className={`absolute inset-y-0 left-0 z-[2] rounded-full ${row.barClass}`}
              style={{ width: `${row.pct}%` }}
            />
            <QuarterTicks />
          </div>
          <div
            className="text-muted-foreground mt-1 flex justify-between px-0.5 text-[10px] tabular-nums opacity-80"
            aria-hidden
          >
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

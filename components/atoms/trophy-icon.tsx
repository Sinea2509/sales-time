/**
 * Les trophées du podium : or, argent, bronze, puis un simple rang.
 *
 * Trois couleurs et une seule forme, celle de la maquette du 11 septembre.
 * Le rang est toujours dit en toutes lettres dans l'étiquette d'accessibilité,
 * pour que la couleur renforce la place sans jamais la porter seule.
 */
const TROPHIES = [
  {
    name: "or",
    bg: "#FBF3E2",
    fill: "#D9A21B",
    stroke: "#A8790C",
    label: "Première place, trophée d'or",
  },
  {
    name: "argent",
    bg: "#F0F2F5",
    fill: "#B9BFC8",
    stroke: "#7F8792",
    label: "Deuxième place, trophée d'argent",
  },
  {
    name: "bronze",
    bg: "#F8ECE3",
    fill: "#C97F45",
    stroke: "#8F5426",
    label: "Troisième place, trophée de bronze",
  },
] as const;

export function TrophyIcon({ rank }: { rank: number }) {
  const t = TROPHIES[rank - 1];
  if (!t) {
    return (
      <span className="border-border bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums">
        {rank}
      </span>
    );
  }
  return (
    <span
      className="grid size-8 shrink-0 place-items-center rounded-full"
      style={{ background: t.bg }}
      role="img"
      aria-label={t.label}
      title={t.label}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M7 3h10v6.5a5 5 0 0 1-10 0V3z"
          fill={t.fill}
          stroke={t.stroke}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M7 5H4v2.5A3.5 3.5 0 0 0 7.2 11M17 5h3v2.5a3.5 3.5 0 0 1-3.2 3.5"
          fill="none"
          stroke={t.stroke}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M11 14.5h2V18h-2z"
          fill={t.fill}
          stroke={t.stroke}
          strokeWidth="1"
        />
        <path
          d="M8.5 18h7a1 1 0 0 1 1 1v1.5h-9V19a1 1 0 0 1 1-1z"
          fill={t.fill}
          stroke={t.stroke}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M9.3 4.6h1.4v4.2H9.3z" fill="#fff" opacity=".45" />
      </svg>
    </span>
  );
}

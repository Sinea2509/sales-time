import { DISC_HEX } from "@/src/core/domain/seller-affinity-from-meetings";

type DiscKey = "D" | "I" | "S" | "C";

const DISC_NAMES: Readonly<Record<DiscKey, string>> = {
  D: "Dominance",
  I: "Influence",
  S: "Stabilité",
  C: "Conformité",
};

/** Quadrants dans l'ordre horaire depuis midi : I, S, C, D. */
const QUADRANTS: ReadonlyArray<readonly [DiscKey, number, number]> = [
  ["I", 0, 90],
  ["S", 90, 180],
  ["C", 180, 270],
  ["D", 270, 360],
];

function polar(cx: number, cy: number, angle: number, radius: number) {
  const a = ((angle - 90) * Math.PI) / 180;
  return [
    (cx + radius * Math.cos(a)).toFixed(1),
    (cy + radius * Math.sin(a)).toFixed(1),
  ] as const;
}

function wedge(
  cx: number,
  cy: number,
  a0: number,
  a1: number,
  radius: number,
): string {
  const [x0, y0] = polar(cx, cy, a0, radius);
  const [x1, y1] = polar(cx, cy, a1, radius);
  return `M${cx} ${cy} L${x0} ${y0} A${radius} ${radius} 0 0 1 ${x1} ${y1} Z`;
}

/**
 * La roue DISC : quatre quadrants, chacun rempli à hauteur de son score.
 * Le style principal est plus opaque ; les chiffres sont écrits en clair,
 * la roue ne fait que les montrer d'un coup.
 */
export function DiscWheel({
  scores,
  dominant,
  size = 296,
}: {
  scores: Readonly<Record<DiscKey, number>>;
  dominant: DiscKey;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 34;
  const label = `Roue DISC : ${QUADRANTS.map(([k]) => `${DISC_NAMES[k]} ${scores[k]}`).join(", ")}.`;

  return (
    <div role="img" aria-label={label}>
      <svg
        viewBox={`-6 -6 ${size + 12} ${size + 12}`}
        width="100%"
        style={{ maxWidth: size, display: "block", margin: "0 auto" }}
      >
        {QUADRANTS.map(([k, a0, a1]) => (
          <path
            key={`bg-${k}`}
            d={wedge(cx, cy, a0, a1, R)}
            fill={DISC_HEX[k]}
            fillOpacity={0.12}
            stroke="var(--card)"
            strokeWidth={2}
          />
        ))}
        {QUADRANTS.map(([k, a0, a1]) => (
          <path
            key={`val-${k}`}
            d={wedge(cx, cy, a0, a1, Math.max(6, (R * scores[k]) / 100))}
            fill={DISC_HEX[k]}
            fillOpacity={k === dominant ? 0.92 : 0.72}
            stroke="var(--card)"
            strokeWidth={2}
          />
        ))}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" />
        <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="var(--border)" />
        <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="var(--border)" />
        {QUADRANTS.map(([k, a0, a1]) => {
          const [x, y] = polar(cx, cy, (a0 + a1) / 2, R + 22);
          return (
            <g key={`lbl-${k}`}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={14}
                fontWeight={800}
                fill={DISC_HEX[k]}
              >
                {k}
              </text>
              <text
                x={x}
                y={(Number(y) + 15).toFixed(1)}
                textAnchor="middle"
                fontSize={10.5}
                fill="var(--muted-foreground)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {scores[k]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export { DISC_NAMES };

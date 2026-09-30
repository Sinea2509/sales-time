/**
 * Un trait de quelques centimètres à côté d'une moyenne : la forme d'une
 * série, pas sa lecture. Il n'a ni axe ni graduation, et il disparaît sous
 * deux points, faute de trait à tracer.
 */
export function Sparkline({
  values,
  width = 118,
  height = 34,
  label,
}: {
  values: readonly number[];
  width?: number;
  height?: number;
  /** Ce que la série mesure, pour l'étiquette d'accessibilité. */
  label: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  const x = (i: number) => 3 + (i * (width - 6)) / (values.length - 1);
  const y = (v: number) =>
    height - 3 - ((v - min) * (height - 6)) / (max - min);
  const d = values
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join("");
  const last = values[values.length - 1]!;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`${label} : ${values.length} points, dernier ${last}`}
      className="shrink-0"
    >
      <path
        d={d}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={x(values.length - 1).toFixed(1)}
        cy={y(last).toFixed(1)}
        r="3"
        fill="var(--brand)"
      />
    </svg>
  );
}

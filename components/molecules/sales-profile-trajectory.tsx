import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import {
  salesProfileHistoryFilledCount,
  type SalesProfilePeriodPoint,
} from "@/src/core/domain/sales-profile-history";

/**
 * La trajectoire du profil global sur plusieurs périodes, en courbe compacte.
 *
 * La croissance dit le dernier pas ; cette courbe dit le chemin. Une ligne fine
 * relie la moyenne du profil de chaque période, la plus ancienne à gauche, la
 * plus récente à droite, avec un point de marque sur la dernière valeur. Une
 * période sans rendez-vous noté n'a pas de point : la ligne part du premier
 * relevé disponible plutôt que de plonger à zéro.
 *
 * Sous deux relevés il n'y a pas de trajectoire, seulement un point : la courbe
 * ne se dessine pas, la croissance chiffrée juste au-dessus suffit.
 */
const VIEW_W = 320;
const VIEW_H = 60;
const PAD_X = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 10;

export function SalesProfileTrajectory({
  history,
  statsWindowDays,
}: {
  history: SalesProfilePeriodPoint[];
  statsWindowDays?: StatsWindowDays;
}) {
  const filled = salesProfileHistoryFilledCount(history);
  if (filled < 2 || history.length < 2) return null;

  const n = history.length;
  const xAt = (index: number) =>
    PAD_X + (index / (n - 1)) * (VIEW_W - 2 * PAD_X);
  const yAt = (value: number) =>
    VIEW_H - PAD_BOTTOM - (value / 100) * (VIEW_H - PAD_TOP - PAD_BOTTOM);

  const points = history
    .map((point, index) => ({ index, average: point.average }))
    .filter(
      (point): point is { index: number; average: number } =>
        point.average !== null,
    )
    .map((point) => ({
      x: xAt(point.index),
      y: yAt(point.average),
      average: point.average,
    }));

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const baseline = VIEW_H - PAD_BOTTOM;
  const area = `${first.x},${baseline} ${line} ${last.x},${baseline}`;

  return (
    <div className="mt-4">
      <div className="text-muted-foreground mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider uppercase">
          Trajectoire du profil global
        </span>
        <span className="text-[10px]">
          {filled} périodes de {statsWindowDays ?? 30} j
        </span>
      </div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Trajectoire de la note globale sur ${filled} périodes, de ${first.average} sur cent la plus ancienne à ${last.average} sur cent la plus récente.`}
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={PAD_X}
          x2={VIEW_W - PAD_X}
          y1={yAt(50)}
          y2={yAt(50)}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <polygon points={area} fill="var(--brand)" fillOpacity={0.08} />
        <polyline
          points={line}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 3.5 : 2}
            fill="var(--brand)"
          />
        ))}
        <text
          x={last.x}
          y={last.y - 6}
          textAnchor="end"
          className="fill-foreground text-[11px] font-semibold"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {last.average}
        </text>
      </svg>
    </div>
  );
}

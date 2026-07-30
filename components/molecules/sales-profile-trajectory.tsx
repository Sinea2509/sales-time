import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import {
  salesProfileHistoryFilledCount,
  salesProfileTrajectoryBand,
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
 *
 * L'échelle verticale se resserre autour des relevés au lieu de couvrir 0 à 100,
 * sans quoi les quelques points d'écart d'un même commercial donnaient une ligne
 * plate. Une échelle resserrée ne se lit qu'annoncée, d'où les deux bornes
 * écrites sur le flanc gauche, et le trait pointillé posé au niveau du premier
 * relevé, qui répond d'un coup d'œil à « au-dessus ou en dessous du départ ».
 */
const VIEW_W = 320;
const VIEW_H = 96;
const PAD_LEFT = 30;
const PAD_RIGHT = 10;
const PAD_TOP = 16;
const PAD_BOTTOM = 14;

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
  const filledPoints = history
    .map((point, index) => ({ index, average: point.average }))
    .filter(
      (point): point is { index: number; average: number } =>
        point.average !== null,
    );
  const bande = salesProfileTrajectoryBand(filledPoints.map((p) => p.average));

  const xAt = (index: number) =>
    PAD_LEFT + (index / (n - 1)) * (VIEW_W - PAD_LEFT - PAD_RIGHT);
  const hauteurTrace = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const baseline = VIEW_H - PAD_BOTTOM;
  const yAt = (value: number) =>
    baseline - ((value - bande.low) / (bande.high - bande.low)) * hauteurTrace;

  const points = filledPoints.map((point) => ({
    x: xAt(point.index),
    y: yAt(point.average),
    average: point.average,
    index: point.index,
    rdvCount: history[point.index].rdvCount,
  }));

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const area = `${first.x},${baseline} ${line} ${last.x},${baseline}`;

  return (
    <div className="mt-4">
      {/*
        `flex-wrap` parce que sur une carte étroite, à 390 px de large, le titre
        et le rappel de profondeur se touchaient : mieux vaut deux lignes que
        deux libellés collés.
      */}
      <div className="text-muted-foreground mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
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
        aria-label={`Trajectoire de la note globale sur ${filled} périodes, de ${first.average} sur cent la plus ancienne à ${last.average} sur cent la plus récente. Échelle resserrée de ${bande.low} à ${bande.high}.`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/*
          Les deux bornes de l'échelle, écrites parce qu'elle est resserrée.
          Chiffres tabulaires : ils forment une colonne de deux nombres qui
          doivent s'aligner, seul cas où l'alignement vaut mieux que la largeur
          naturelle des chiffres.
        */}
        <text
          x={PAD_LEFT - 6}
          y={PAD_TOP + 3}
          textAnchor="end"
          className="fill-muted-foreground text-[9px]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {bande.high}
        </text>
        <text
          x={PAD_LEFT - 6}
          y={baseline + 3}
          textAnchor="end"
          className="fill-muted-foreground text-[9px]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {bande.low}
        </text>
        {/*
          Le repère est le niveau du premier relevé, non le milieu de l'échelle :
          la question que cette courbe sert est « a-t-il progressé depuis », et
          un trait au niveau du départ y répond sans calcul.
        */}
        <line
          x1={PAD_LEFT}
          x2={VIEW_W - PAD_RIGHT}
          y1={first.y}
          y2={first.y}
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
        {points.map((point) => (
          <circle
            key={point.index}
            cx={point.x}
            cy={point.y}
            r={point.index === last.index ? 3.5 : 2}
            fill="var(--brand)"
          />
        ))}
        {/*
          Une cible de survol plus large que le point, transparente, avec le
          détail de la période en infobulle native : la valeur de chaque relevé
          reste atteignable sans charger de code côté navigateur.
        */}
        {points.map((point) => (
          <circle
            key={`cible-${point.index}`}
            cx={point.x}
            cy={point.y}
            r={9}
            fill="transparent"
          >
            <title>{`Période ${point.index + 1} sur ${n} : ${point.average}/100 sur ${point.rdvCount} RDV analysés`}</title>
          </circle>
        ))}
        {/*
          La dernière valeur en clair. Chiffres proportionnels, ceux de la
          fonte par défaut : c'est une valeur isolée, pas une colonne, et les
          chiffres tabulaires la feraient paraître lâche.
        */}
        <text
          x={last.x}
          y={last.y - 7}
          textAnchor="end"
          className="fill-foreground text-[11px] font-semibold"
        >
          {last.average}
        </text>
      </svg>
    </div>
  );
}

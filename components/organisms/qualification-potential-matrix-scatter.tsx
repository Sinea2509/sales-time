"use client";

import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { useMemo, useState } from "react";
import {
  meetingEtapePillClassForLabel,
  sortEtapesByVocabulary,
} from "@/lib/meeting-etape-pill";
import { sellerScatterStylesByUserId } from "@/lib/seller-scatter-colors";
import { ChartTheme } from "@/components/atoms/chart-theme";
import { cn } from "@/lib/utils";
import {
  MATRIX_AXIS_MAX,
  MATRIX_AXIS_MIN,
  MATRIX_AXIS_TICKS,
  type QualificationPotentialMatrixPoint,
} from "@/src/core/domain/meeting-analyse-matrices";
import {
  QualificationMatrixScatterTooltip,
  type QualificationMatrixScatterTooltipMeta,
} from "@/components/molecules/qualification-matrix-scatter-tooltip";
import { QualificationMatrixQuadrantLabels } from "@/components/molecules/qualification-matrix-quadrant-labels";
import { quadrantDeLaMatrice } from "@/src/core/domain/matrice-quadrants";

/*
  La croix du repère portait le bleu « Proposition », c'est-à-dire la couleur
  exacte d'une des séries de points du même graphique. Une ligne de repère
  peinte comme une donnée se lit comme une donnée : on cherche à quel RDV elle
  correspond. Elle prend maintenant l'encre de chrome du thème, qui n'est
  attribuée à aucune série et suit le mode clair ou sombre toute seule.
*/
const ORIGIN_LINE_STYLE = {
  stroke: "var(--chart-ink)",
  strokeWidth: 1.5,
  strokeDasharray: "6 4",
};

/*
  La couleur des points quand il n'y a qu'une série.

  Le jeton de marque suit le mode clair ou sombre tout seul, et suivra une
  organisation qui personnalisera ses couleurs. Mesuré au validateur de contraste,
  il tient le seuil de 3:1 exigé d'une marque de donnée dans les deux modes :
  #6c4dff sur blanc, #8b7cff sur la carte sombre. Aucune autre série ne
  l'utilise dans ce graphique, donc rien ne peut le confondre avec autre chose.
*/
const POINT_COLOR = "var(--brand)";

const compactTickLabel = { fontSize: 10 };
const compactAxisLabel = { fontSize: 11 };

const matrixAxisConfig = {
  scaleType: "linear" as const,
  min: MATRIX_AXIS_MIN,
  max: MATRIX_AXIS_MAX,
  domainLimit: "strict" as const,
  tickNumber: MATRIX_AXIS_TICKS.length,
  tickLabelInterval: () => true,
  tickSize: 4,
  tickLabelStyle: compactTickLabel,
  labelStyle: compactAxisLabel,
  valueFormatter: (value: number | null) =>
    value == null ? "" : String(Math.round(value)),
};

type ScatterSeries = {
  id: string;
  label: string;
  data: Array<{
    id: string;
    x: number;
    y: number;
    z: QualificationMatrixScatterTooltipMeta;
  }>;
  color: string;
  markerSize: number;
};

/**
 * Une entrée de la rangée de filtres, sous le graphique.
 *
 * `color` ne vaut quelque chose que si la couleur des points dit à quel groupe
 * ils appartiennent, ce qui n'est vrai qu'en vue équipe. Par étape, les points
 * partagent une seule couleur : la pastille n'affiche donc pas de rond, parce
 * qu'un rond identique sur chaque ligne ferait croire à un code couleur.
 */
type FilterChip = {
  key: string;
  label: string;
  color: string | null;
  pillClass: string;
  count: number;
};

function tooltipMetaFromPoint(
  point: QualificationPotentialMatrixPoint,
  options?: { includeSeller?: boolean },
): QualificationMatrixScatterTooltipMeta {
  const quadrant = quadrantDeLaMatrice(point);
  return {
    contactName: point.prospectName,
    etape: point.etape,
    potentialAmount: point.potentialAmount,
    salesScore: point.salesScore,
    sellerDisplayName: options?.includeSeller
      ? point.sellerDisplayName
      : undefined,
    // Un point posé sur un axe n'a pas de quadrant, donc pas d'action :
    // l'info-bulle saute la ligne plutôt que d'en inventer une.
    quadrantAction: quadrant?.action ?? null,
    quadrantRaison: quadrant?.raison ?? null,
  };
}

export function QualificationPotentialMatrixScatter({
  points,
  height = 420,
  legendMode = "etape",
  etapeOrder,
}: {
  points: QualificationPotentialMatrixPoint[];
  height?: number;
  /** Vue manager : une couleur par commercial. */
  legendMode?: "etape" | "seller";
  /**
   * Le vocabulaire d'étapes de l'organisation, qui range la rangée de filtres.
   *
   * Sans lui, le rangement retombe sur les listes installées par défaut : la
   * rangée reste lisible, mais une organisation qui a réécrit ses étapes verra
   * les siennes reléguées après, par ordre alphabétique.
   */
  etapeOrder?: readonly string[];
}) {
  const [exclues, setExclues] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  /*
    Les styles des commerciaux se calculent sur TOUS les points, jamais sur les
    points visibles. Sinon masquer un commercial repeindrait les autres, et la
    couleur d'une personne dépendrait de qui d'autre est à l'écran.
  */
  const sellerStyles = useMemo(
    () =>
      legendMode === "seller"
        ? sellerScatterStylesByUserId(points)
        : new Map<
            string,
            { label: string; color: string; pillClass: string }
          >(),
    [legendMode, points],
  );

  /** La clé de regroupement d'un point : son étape, ou son commercial. */
  const cleDuPoint = useMemo(() => {
    if (legendMode === "seller") {
      return (p: QualificationPotentialMatrixPoint) => p.sellerUserId;
    }
    return (p: QualificationPotentialMatrixPoint) => p.etape;
  }, [legendMode]);

  const chips = useMemo<FilterChip[]>(() => {
    const counts = new Map<string, number>();
    for (const point of points) {
      const cle = cleDuPoint(point);
      counts.set(cle, (counts.get(cle) ?? 0) + 1);
    }

    if (legendMode === "seller") {
      return [...sellerStyles.entries()]
        .filter(([sellerUserId]) => counts.has(sellerUserId))
        .map(([sellerUserId, style]) => ({
          key: sellerUserId,
          label: style.label,
          color: style.color,
          pillClass: style.pillClass,
          count: counts.get(sellerUserId) ?? 0,
        }));
    }

    return sortEtapesByVocabulary([...counts.keys()], etapeOrder ?? []).map(
      (etape) => ({
        key: etape,
        label: etape,
        color: null,
        pillClass: meetingEtapePillClassForLabel(etape),
        count: counts.get(etape) ?? 0,
      }),
    );
  }, [cleDuPoint, etapeOrder, legendMode, points, sellerStyles]);

  const pointsVisibles = useMemo(
    () => points.filter((p) => !exclues.has(cleDuPoint(p))),
    [cleDuPoint, exclues, points],
  );

  const series = useMemo<ScatterSeries[]>(() => {
    if (legendMode === "seller") {
      return [...sellerStyles.entries()]
        .map(([sellerUserId, style]) => ({
          id: `seller-${sellerUserId}`,
          label: style.label,
          data: pointsVisibles
            .filter((p) => p.sellerUserId === sellerUserId)
            .map((p) => ({
              id: p.id,
              x: p.qualification,
              y: p.potential,
              z: tooltipMetaFromPoint(p, { includeSeller: true }),
            })),
          color: style.color,
          markerSize: 8,
        }))
        .filter((s) => s.data.length > 0);
    }

    if (pointsVisibles.length === 0) return [];
    return [
      {
        id: "rendez-vous",
        label: "Rendez-vous",
        data: pointsVisibles.map((p) => ({
          id: p.id,
          x: p.qualification,
          y: p.potential,
          z: tooltipMetaFromPoint(p),
        })),
        color: POINT_COLOR,
        markerSize: 8,
      },
    ];
  }, [legendMode, pointsVisibles, sellerStyles]);

  const chartSeries = useMemo(() => {
    if (series.length > 0) return series;
    return [
      {
        id: "axis-placeholder",
        label: "",
        data: [
          {
            id: "__axis-placeholder__",
            x: 0,
            y: 0,
            z: {} as QualificationMatrixScatterTooltipMeta,
          },
        ],
        color: "transparent",
        markerSize: 0,
      },
    ];
  }, [series]);

  /*
    Deux repères vides ne se ressemblent pas. Sans aucun rendez-vous à placer,
    il n'y a rien à faire sur cet écran. Avec des rendez-vous tous masqués, il
    suffit d'en afficher un de nouveau : dire la même phrase dans les deux cas
    enverrait le lecteur chercher une panne qui n'existe pas.
  */
  const aucunPoint = points.length === 0;
  const filtreVide = !aucunPoint && pointsVisibles.length === 0;
  const unFiltreEstActif = chips.some((chip) => exclues.has(chip.key));

  const basculer = (cle: string) => {
    setExclues((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(cle)) suivant.delete(cle);
      else suivant.add(cle);
      return suivant;
    });
  };

  const groupeLibelle =
    legendMode === "seller"
      ? "Afficher ou masquer les points d'un commercial"
      : "Afficher ou masquer les points d'une étape";

  return (
    <div className="w-full space-y-2">
      {/*
        Sans message, la matrice vide dessinait deux axes gradués et rien
        d'autre. Deux axes nus se lisent comme un graphique qui n'a pas fini de
        charger, ou comme une panne : le lecteur attend des points qui ne
        viendront jamais. La phrase dit pourquoi il n'y en a pas, et quoi faire
        pour qu'il y en ait.
      */}
      <div className="relative">
        {aucunPoint || filtreVide ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            <p className="text-muted-foreground bg-card/85 max-w-xs rounded-lg px-3 py-2 text-center text-sm text-balance">
              {aucunPoint
                ? "Aucun rendez-vous à placer. Un rendez-vous n'apparaît ici qu'une fois analysé et doté d'un montant potentiel."
                : "Tout est masqué. Affichez de nouveau une entrée sous le graphique pour retrouver des points."}
            </p>
          </div>
        ) : null}
        <ChartTheme>
          <ScatterChart
            height={height}
            series={chartSeries}
            slots={{ tooltip: QualificationMatrixScatterTooltip }}
            xAxis={[
              {
                id: "qualification",
                ...matrixAxisConfig,
                label: "Qualification",
                height: 28,
              },
            ]}
            yAxis={[
              {
                id: "potential",
                ...matrixAxisConfig,
                label: "Potentiel",
                width: 30,
              },
            ]}
            grid={{ vertical: true, horizontal: true }}
            hideLegend
            hitAreaRadius={24}
            margin={{ top: 8, right: 8, bottom: 32, left: 36 }}
            slotProps={{
              tooltip: { trigger: "item" },
              axisTickLabel: { style: compactTickLabel },
              axisLabel: { style: compactAxisLabel },
            }}
          >
            <ChartsReferenceLine
              x={0}
              axisId="qualification"
              lineStyle={ORIGIN_LINE_STYLE}
            />
            <ChartsReferenceLine
              y={0}
              axisId="potential"
              lineStyle={ORIGIN_LINE_STYLE}
            />
            {/*
              Sans point à ranger, quatre consignes d'action posées sur un
              repère vide donneraient des ordres sur rien.
            */}
            {aucunPoint || filtreVide ? null : (
              <QualificationMatrixQuadrantLabels />
            )}
          </ScatterChart>
        </ChartTheme>
      </div>
      {/*
        Les deux axes ne se lisent pas de la même façon, et rien ne le disait :
        l'abscisse est une note absolue, l'ordonnée une position relative aux
        autres rendez-vous de la période. Deux points identiques sur l'écran
        peuvent donc porter des montants très différents d'une période à
        l'autre, ce qui reste incompréhensible tant que la règle n'est pas
        écrite.
      */}
      <p className="text-muted-foreground text-xs text-balance">
        Horizontale : le SalesScore du rendez-vous, 50 au centre. Verticale :
        son montant potentiel, comparé aux autres rendez-vous de la période.
      </p>
      {/*
        Cette rangée était une légende des couleurs. Par étape, il n'y a plus
        de couleur à expliquer, et une légende qui n'explique rien occupe la
        place sans rien rendre. Elle filtre : un clic isole une étape, ce que
        la couleur ne permettait pas, même quand elle marchait.
      */}
      {chips.length === 0 ? null : (
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label={groupeLibelle}
        >
          {chips.map((chip) => {
            const visible = !exclues.has(chip.key);
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => basculer(chip.key)}
                aria-pressed={visible}
                aria-label={`${chip.label}, ${chip.count} rendez-vous, ${
                  visible ? "affichés" : "masqués"
                }`}
                className={cn(
                  "focus-visible:ring-ring inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                  chip.pillClass,
                  // Masqué : la pastille reste lisible, mais s'efface assez
                  // pour qu'on voie d'un coup d'œil ce qui est retiré.
                  visible ? "" : "line-through opacity-50",
                )}
              >
                {chip.color ? (
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: chip.color }}
                    aria-hidden
                  />
                ) : null}
                {chip.label}
                <span className="text-muted-foreground tabular-nums">
                  ({chip.count})
                </span>
              </button>
            );
          })}
          {unFiltreEstActif ? (
            <button
              type="button"
              onClick={() => setExclues(new Set<string>())}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-pointer rounded-full px-2 py-0.5 text-xs underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
            >
              Tout afficher
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

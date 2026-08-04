"use client";

import type { ComponentProps } from "react";
import {
  ChartsTooltipContainer,
  useItemTooltip,
} from "@mui/x-charts/ChartsTooltip";
import { useSeries } from "@mui/x-charts/hooks";
import { SALES_SCORE_LABEL } from "@/lib/sales-score-color";

export type QualificationMatrixScatterTooltipMeta = {
  contactName: string;
  /**
   * L'étape du rendez-vous, écrite en toutes lettres.
   *
   * Elle ne se déduit plus de la couleur du point : tous les points d'une même
   * personne partagent désormais une seule teinte. L'info-bulle est donc le
   * seul endroit où l'étape d'un point précis se lit.
   */
  etape: string;
  potentialAmount: number | null;
  salesScore: number | null;
  sellerDisplayName?: string;
  /** Le quadrant du point, ou rien s'il est posé sur un des deux axes. */
  quadrantAction: string | null;
  quadrantRaison: string | null;
};

const euroFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatPotentialEuro(amount: number | null): string {
  if (amount == null) return "Non renseigné";
  return euroFormat.format(amount);
}

function QualificationMatrixTooltipContent() {
  const tooltip = useItemTooltip();
  const series = useSeries();

  if (!tooltip || "values" in tooltip) return null;
  if (!("dataIndex" in tooltip.identifier)) return null;

  const { seriesId, dataIndex } = tooltip.identifier;
  if (seriesId == null || dataIndex == null) return null;

  const scatterSeries = series.scatter?.series[seriesId];
  const datum = scatterSeries?.data[dataIndex];
  const meta = datum?.z as QualificationMatrixScatterTooltipMeta | undefined;
  if (!meta) return null;

  return (
    <div className="bg-popover text-popover-foreground max-w-64 space-y-1 rounded-lg border border-border px-3 py-2 text-xs shadow-md dark:border-neutral-800">
      <p className="text-foreground text-sm font-semibold leading-snug">
        {meta.contactName}
      </p>
      {meta.etape ? (
        <p>
          <span className="text-muted-foreground">Étape : </span>
          <span className="font-medium">{meta.etape}</span>
        </p>
      ) : null}
      {meta.sellerDisplayName ? (
        <p>
          <span className="text-muted-foreground">Commercial : </span>
          <span className="font-medium">{meta.sellerDisplayName}</span>
        </p>
      ) : null}
      <p>
        <span className="text-muted-foreground">Montant : </span>
        <span className="font-medium tabular-nums">
          {formatPotentialEuro(meta.potentialAmount)}
        </span>
      </p>
      <p>
        <span className="text-muted-foreground">{SALES_SCORE_LABEL} : </span>
        <span className="font-medium tabular-nums">
          {meta.salesScore ?? "Non noté"}
        </span>
      </p>
      {/*
        La position d'un point dans le repère porte déjà une consigne, mais il
        fallait la déduire de deux signes. L'info-bulle la dit, et dit sur quoi
        elle repose : une action sans son motif se lit comme un ordre.
      */}
      {meta.quadrantAction ? (
        <p className="border-t border-border pt-1 dark:border-neutral-800">
          <span className="text-foreground font-semibold">
            {meta.quadrantAction}
          </span>
          {meta.quadrantRaison ? (
            <span className="text-muted-foreground block leading-snug text-balance">
              {meta.quadrantRaison}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export function QualificationMatrixScatterTooltip(
  props: ComponentProps<typeof ChartsTooltipContainer>,
) {
  return (
    <ChartsTooltipContainer trigger="item" anchor="node" {...props}>
      <QualificationMatrixTooltipContent />
    </ChartsTooltipContainer>
  );
}

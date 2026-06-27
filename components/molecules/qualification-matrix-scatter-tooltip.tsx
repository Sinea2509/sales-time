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
  potentialAmount: number | null;
  salesScore: number | null;
  sellerDisplayName?: string;
};

const euroFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatPotentialEuro(amount: number | null): string {
  if (amount == null) return "—";
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
    <div className="bg-popover text-popover-foreground space-y-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs shadow-md dark:border-neutral-800">
      <p className="text-foreground text-sm font-semibold leading-snug">
        {meta.contactName}
      </p>
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
          {meta.salesScore ?? "—"}
        </span>
      </p>
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

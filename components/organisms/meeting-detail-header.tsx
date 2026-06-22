import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { MeetingFollowUpEmailDialog } from "@/components/organisms/meeting-follow-up-email-dialog";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import {
  meetingEtapeDisplayLabel,
  meetingEtapePillClass,
} from "@/lib/meeting-etape-pill";
import { pageTitleClass } from "@/lib/page-typography";
import { prospectInitials } from "@/lib/prospect-initials";
import { cn } from "@/lib/utils";

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

const euroFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatPotentialEuro(amount: number | null): string {
  if (amount == null) return "—";
  return euroFormat.format(amount);
}

function statColumn({
  value,
  label,
  title,
  valueExtra,
}: {
  value: string;
  label: string;
  title?: string;
  valueExtra?: ReactNode;
}) {
  return (
    <div
      className="flex min-w-[4.5rem] flex-col items-start gap-1 sm:min-w-[5.5rem]"
      title={title}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        {valueExtra}
      </div>
      <span className="text-muted-foreground max-w-[7rem] text-left text-[11px] font-medium leading-tight">
        {label}
      </span>
    </div>
  );
}

function SalesScoreDeltaBadge({ delta }: { delta: number }) {
  const display =
    Math.abs(delta % 1) < 0.05 ? String(Math.round(delta)) : String(delta);
  const positive = delta > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        positive
          ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-100"
          : "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-100",
      )}
      aria-label={
        positive
          ? `SalesScore en hausse de ${display} points`
          : `SalesScore en baisse de ${display} points`
      }
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {positive ? "+" : ""}
      {display}
    </span>
  );
}

export type MeetingDetailHeaderProps = {
  meetingId: string;
  prospectName: string;
  prospectCompany: string | null;
  meetingAt: Date;
  meetingType: string | null;
  pipelineStage: string | null;
  potentialAmount: number | null;
  tamMinutesPerRdv: number;
  salesScore: number | null;
  salesScoreDelta: number | null;
  followUpEmailDraft: string | null;
};

export function MeetingDetailHeader({
  meetingId,
  prospectName,
  prospectCompany,
  meetingAt,
  meetingType,
  pipelineStage,
  potentialAmount,
  tamMinutesPerRdv,
  salesScore,
  salesScoreDelta,
  followUpEmailDraft,
}: MeetingDetailHeaderProps) {
  const etapeLabel = meetingEtapeDisplayLabel({
    meetingType,
    pipelineStage,
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-lg font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-100 dark:ring-zinc-700/80">
          {prospectInitials(prospectName)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={cn(pageTitleClass, "truncate")}>{prospectName}</h1>
            {etapeLabel !== "—" ? (
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  meetingEtapePillClass({ meetingType, pipelineStage }),
                )}
              >
                {etapeLabel}
              </span>
            ) : null}
          </div>
          {prospectCompany?.trim() ? (
            <p className="text-muted-foreground mt-0.5 truncate text-sm">
              {prospectCompany.trim()}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:gap-6">
        <div className="flex flex-wrap items-start gap-6 sm:gap-8">
          {statColumn({
            value: formatPotentialEuro(potentialAmount),
            label: "Montant",
          })}
          {statColumn({
            value: formatDurationHoursMinutes(tamMinutesPerRdv),
            label: "TAM",
            title: "Temps utile estimé récupéré sur ce RDV",
          })}
          {statColumn({
            value: dateShort.format(meetingAt),
            label: "Date du RDV",
          })}
          {statColumn({
            value: salesScore != null ? String(salesScore) : "—",
            label: "SalesScore",
            valueExtra:
              salesScoreDelta != null && salesScoreDelta !== 0 ? (
                <SalesScoreDeltaBadge delta={salesScoreDelta} />
              ) : null,
          })}
        </div>

        <MeetingFollowUpEmailDialog
          meetingId={meetingId}
          prospectName={prospectName}
          initialDraft={followUpEmailDraft}
        />
      </div>
    </div>
  );
}

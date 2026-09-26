import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { MeetingEtapeBadge } from "@/components/atoms/meeting-etape-badge";
import { AnimatedSalesScore } from "@/components/molecules/animated-sales-score";
import { MeetingFollowUpEmailDialog } from "@/components/organisms/meeting-follow-up-email-dialog";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { formatPotentialEuro } from "@/lib/format-potential-euro";
import {
  ETAPE_NON_RENSEIGNEE,
  meetingEtapeDisplayLabel,
} from "@/lib/meeting-etape-pill";
import { pageTitleClass } from "@/lib/page-typography";
import { plurielFr } from "@/lib/pluriel-fr";
import { prospectInitials } from "@/lib/prospect-initials";
import { cn } from "@/lib/utils";

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

function statColumn({
  value,
  label,
  title,
  valueExtra,
  valueClassName,
}: {
  value: ReactNode;
  label: string;
  title?: string;
  valueExtra?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div
      className="flex min-w-[4.5rem] flex-col items-start gap-1 sm:min-w-[5.5rem]"
      title={title}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-foreground text-2xl font-semibold tabular-nums tracking-tight",
            valueClassName,
          )}
        >
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
  /*
    L'écart est arrondi avant d'être jugé, et non après. Un badge qui annonce
    « +0 » sous une flèche montante affirme une hausse que le chiffre écrit à
    côté dément aussitôt : quand l'arrondi ramène l'écart à zéro, il n'y a rien
    à annoncer, et le badge s'efface plutôt que d'inventer un sens à la flèche.
  */
  const magnitude = Math.round(Math.abs(delta) * 10) / 10;
  if (magnitude === 0) return null;

  // Virgule décimale et vrai signe moins (U+2212) : « −1,5 » et non « -1.5 ».
  const chiffres = Number.isInteger(magnitude)
    ? String(magnitude)
    : magnitude.toFixed(1).replace(".", ",");
  const positive = delta > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const sens = positive ? "en hausse" : "en baisse";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        positive
          ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-100"
          : "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-100",
      )}
      aria-label={`SalesScore ${sens} de ${chiffres} ${plurielFr(magnitude, "point")} par rapport au rendez-vous précédent`}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {positive ? "+" : "−"}
      {chiffres}
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
  /** Vrai pendant l'analyse automatique : le score est attendu, pas absent. */
  salesScorePending?: boolean;
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
  salesScorePending = false,
  followUpEmailDraft,
}: MeetingDetailHeaderProps) {
  const etapeLabel = meetingEtapeDisplayLabel({
    meetingType,
    pipelineStage,
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-card text-lg font-semibold text-foreground shadow-sm ring-1 ring-border/80 dark:bg-zinc-100 dark:ring-zinc-700/80">
          {prospectInitials(prospectName)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={cn(pageTitleClass, "truncate")}>{prospectName}</h1>
            {/*
              Ici l'insigne disparaît quand l'étape n'est pas renseignée, au
              lieu d'afficher « Non renseignée » comme le fait le tableau. Un
              titre de page nomme le rendez-vous ; il n'est pas le bon endroit
              pour signaler un champ vide, que la ligne du tableau et le
              formulaire d'édition disent déjà.
            */}
            {etapeLabel !== ETAPE_NON_RENSEIGNEE ? (
              <MeetingEtapeBadge
                meetingType={meetingType}
                pipelineStage={pipelineStage}
              />
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
            value: (
              <AnimatedSalesScore
                score={salesScore}
                pending={salesScorePending}
              />
            ),
            label: "SalesScore",
            title:
              salesScore == null
                ? salesScorePending
                  ? "Calcul en cours : le SalesScore apparaît dès que le profil SONCAS est analysé."
                  : "Non calculable : ce rendez-vous n'a pas encore d'analyse SONCAS."
                : undefined,
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

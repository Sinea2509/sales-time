import { ToneChip } from "@/components/atoms/tone-chip";
import { SalesScoreRing } from "@/components/molecules/sales-score-ring";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { plurielFr } from "@/lib/pluriel-fr";
import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import type { AnalysisReliability } from "@/src/core/domain/analysis-reliability";
import {
  TALK_SHARE_CEILING_PCT,
  type TalkShare,
} from "@/src/core/domain/talk-share-from-transcript";

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export type MeetingDetailRailProps = {
  salesScore: number | null;
  scorePending: boolean;
  gridName: string | null;
  /** Moyenne du commercial sur ses rendez-vous des 30 derniers jours. */
  sellerAverage30d: number | null;
  /** Moyenne de l'organisation sur la même fenêtre. */
  teamAverage30d: number | null;
  talkShare: TalkShare | null;
  /** Les gestes engagés par ce rendez-vous, tirés du coaching. */
  planActions: string[];
  provenance: {
    gridName: string | null;
    criteriaCount: number | null;
    reliability: AnalysisReliability;
    transcriptWords: number;
    transcribedFromAudio: boolean;
    durationMin: number | null;
    computedAt: Date | null;
  };
};

function Delta({ value, unit }: { value: number | null; unit: string }) {
  if (value == null) {
    return (
      <span className="text-muted-foreground text-xs font-semibold">
        nouveau
      </span>
    );
  }
  const rounded = Math.round(value * 10) / 10;
  const cls =
    rounded > 0
      ? "text-emerald-700 dark:text-emerald-400"
      : rounded < 0
        ? "text-red-700 dark:text-red-400"
        : "text-muted-foreground";
  const arrow = rounded > 0 ? "▲" : rounded < 0 ? "▼" : "◆";
  return (
    <span className={cn("text-xs font-semibold tabular-nums", cls)}>
      <span aria-hidden>{arrow}</span> {rounded > 0 ? "+" : ""}
      {String(rounded).replace(".", ",")}
      {unit}
    </span>
  );
}

function ScoreCard(props: MeetingDetailRailProps) {
  const ecartPerso =
    props.salesScore != null && props.sellerAverage30d != null
      ? props.salesScore - props.sellerAverage30d
      : null;
  const ecartEquipe =
    props.salesScore != null && props.teamAverage30d != null
      ? props.salesScore - props.teamAverage30d
      : null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <SalesScoreRing
            score={props.salesScore}
            pending={props.scorePending}
          />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10.5px] font-bold tracking-[.09em] uppercase">
              SalesScore
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold">
              sur 100
              {props.gridName ? `, grille ${props.gridName.toLowerCase()}` : ""}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11.5px]">
              Moyenne des six leviers SONCAS de ce rendez-vous.
            </p>
          </div>
        </div>
        <dl className="mt-3.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[12.6px]">
          <dt className="text-muted-foreground whitespace-nowrap">
            Sa moyenne, 30 jours
          </dt>
          <dd className="text-right font-medium tabular-nums">
            {props.sellerAverage30d ?? VALEUR_NON_CALCULABLE}
          </dd>
          <dt className="text-muted-foreground whitespace-nowrap">
            Ce rendez-vous vs sa moyenne
          </dt>
          <dd className="text-right">
            <Delta value={ecartPerso} unit=" pt" />
          </dd>
          <dt className="text-muted-foreground whitespace-nowrap">
            Vs moyenne de l&apos;équipe
          </dt>
          <dd className="text-right">
            <Delta value={ecartEquipe} unit=" pt" />
          </dd>
        </dl>
        <p className="text-muted-foreground mt-2.5 text-[11.5px] leading-[1.55]">
          Un rendez-vous isolé ne fait pas une tendance : l&apos;écart se lit
          sur plusieurs rendez-vous.
        </p>
      </CardContent>
    </Card>
  );
}

function TalkShareCard({ share }: { share: TalkShare | null }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className={cardTitleClass}>Répartition de la parole</h2>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Sur le temps où quelqu&apos;un parle. Le plafond de{" "}
          {TALK_SHARE_CEILING_PCT} % vaut pour le commercial : c&apos;est une
          limite, pas un objectif.
        </p>
        {share ? (
          <>
            <div
              className="mt-3.5 flex h-[26px] overflow-hidden rounded-md border border-border"
              role="img"
              aria-label={`${share.commercialLabel} ${share.commercialPct} %, ${share.prospectLabel} ${share.prospectPct} %`}
            >
              <i
                className="bg-brand block h-full"
                style={{ width: `${share.commercialPct}%` }}
              />
              <i
                className="block h-full bg-brand/25"
                style={{ width: `${share.prospectPct}%` }}
              />
            </div>
            <div className="mt-2.5 grid gap-1.5 text-[12.5px]">
              <span>
                <span className="bg-brand mr-1.5 inline-block size-[11px] rounded-[3px] align-[-1px]" />
                {share.commercialLabel}{" "}
                <b className="tabular-nums">{share.commercialPct} %</b>
              </span>
              <span>
                <span className="mr-1.5 inline-block size-[11px] rounded-[3px] bg-brand/25 align-[-1px]" />
                {share.prospectLabel}{" "}
                <b className="tabular-nums">{share.prospectPct} %</b>
              </span>
            </div>
            <p className="mt-2.5 text-[12.5px] leading-relaxed">
              {share.commercialPct > TALK_SHARE_CEILING_PCT ? (
                <ToneChip tone="warn">
                  Plafond dépassé de{" "}
                  {share.commercialPct - TALK_SHARE_CEILING_PCT}{" "}
                  {plurielFr(
                    share.commercialPct - TALK_SHARE_CEILING_PCT,
                    "point",
                  )}
                </ToneChip>
              ) : (
                <ToneChip tone="ok">Sous le plafond</ToneChip>
              )}{" "}
              La plus longue prise de parole d&apos;affilée du commercial fait{" "}
              {share.longestCommercialRunWords.toLocaleString("fr-FR")} mots.
              {share.rolesRecognized
                ? ""
                : " Les rôles ont été déduits de l'ordre de parole."}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground mt-3.5 text-[12.5px] leading-relaxed">
            Non mesurable : le transcript ne distingue pas les intervenants. Un
            enregistrement audio, ou un transcript où chaque réplique commence
            par « Commercial : » ou « Prospect : », le permet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PlanCard({ actions }: { actions: string[] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className={cardTitleClass}>Plan d&apos;action</h2>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Ce rendez-vous engage ces gestes, repris du coaching KISS.
        </p>
        {actions.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {actions.map((a) => (
              <li
                key={a}
                className="rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-[12.5px] leading-relaxed"
              >
                {a}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-3 text-[12.5px]">
            Aucun geste engagé pour l&apos;instant.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ProvenanceCard({ p }: { p: MeetingDetailRailProps["provenance"] }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Grille appliquée", p.gridName ?? "aucune grille pour ce type"],
    [
      "Critères",
      p.criteriaCount != null ? String(p.criteriaCount) : VALEUR_NON_CALCULABLE,
    ],
    [
      "Fiabilité de l'analyse",
      <ToneChip key="f" tone={p.reliability.tone}>
        {p.reliability.level}
      </ToneChip>,
    ],
    [
      "Transcript",
      `${p.transcriptWords.toLocaleString("fr-FR")} mots, ${p.reliability.text}`,
    ],
    [
      "Transcription",
      p.transcribedFromAudio
        ? "depuis un enregistrement audio"
        : "texte fourni",
    ],
    [
      "Durée déclarée",
      p.durationMin != null ? `${p.durationMin} min` : VALEUR_NON_CALCULABLE,
    ],
    [
      "Calculé",
      p.computedAt ? `le ${dateShort.format(p.computedAt)}` : "pas encore",
    ],
  ];
  return (
    <Card className="bg-muted/40 shadow-none">
      <CardContent className="pt-6">
        <h3 className="text-[13.4px] font-semibold">Provenance et fiabilité</h3>
        <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[12.6px]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground whitespace-nowrap">{k}</dt>
              <dd className="text-right font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function MeetingDetailRail(props: MeetingDetailRailProps) {
  return (
    <aside className="grid content-start gap-5 lg:sticky lg:top-[74px]">
      <ScoreCard {...props} />
      <TalkShareCard share={props.talkShare} />
      <PlanCard actions={props.planActions} />
      <ProvenanceCard p={props.provenance} />
    </aside>
  );
}

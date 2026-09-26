import { ArrowLeft } from "lucide-react";
import { MeetingStatusChip } from "@/components/molecules/meeting-status-chip";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { formatPotentialEuro } from "@/lib/format-potential-euro";
import { pageTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";

const dateLongue = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export type MeetingDetailHeaderProps = {
  prospectName: string;
  prospectCompany: string | null;
  prospectJobTitle: string | null;
  meetingAt: Date;
  durationMin: number | null;
  meetingType: string | null;
  pipelineStage: string | null;
  potentialAmount: number | null;
  status: MeetingStatus;
  /** Nom du commercial, montré au manager seulement. */
  sellerName: string | null;
  backHref: string;
};

/**
 * L'en-tête nomme le rendez-vous comme on en parle : « Groupe Vermont,
 * rendez-vous de découverte ». La ligne du dessous porte les faits ; le
 * score, lui, vit dans la colonne de droite, à côté de ce qu'il explique.
 */
export function MeetingDetailHeader({
  prospectName,
  prospectCompany,
  prospectJobTitle,
  meetingAt,
  durationMin,
  meetingType,
  pipelineStage,
  potentialAmount,
  status,
  sellerName,
  backHref,
}: MeetingDetailHeaderProps) {
  const company = prospectCompany?.trim();
  const type = meetingType?.trim();
  const title = `${company || prospectName}${type ? `, rendez-vous de ${type.toLowerCase()}` : ", rendez-vous"}`;

  const facts = [
    company
      ? `${prospectName}${prospectJobTitle ? `, ${prospectJobTitle}` : ""}`
      : prospectJobTitle,
    dateLongue.format(meetingAt),
    durationMin ? `${durationMin} min` : null,
    potentialAmount != null
      ? `potentiel ${formatPotentialEuro(potentialAmount)}`
      : null,
    pipelineStage?.trim() ? `étape ${pipelineStage.trim()}` : null,
    sellerName,
  ].filter((s): s is string => Boolean(s));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <NavLinkButton href={backHref} variant="ghost" size="sm">
        <ArrowLeft className="size-4" aria-hidden />
        Retour
      </NavLinkButton>
      <div className="min-w-0">
        <h1 className={cn(pageTitleClass, "text-[22px] sm:text-[22px]")}>
          {title}
        </h1>
        <p className="text-muted-foreground mt-1 max-w-[78ch] text-[13px]">
          {facts.join(" · ")}
        </p>
      </div>
      <span className="flex-1" />
      <MeetingStatusChip status={status} />
    </div>
  );
}

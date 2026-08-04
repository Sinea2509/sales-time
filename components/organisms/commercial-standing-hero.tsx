import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { CommercialCoachingFocus } from "@/components/molecules/commercial-coaching-focus";
import {
  DashboardStandingCard,
  sousTitreDuGroupe,
} from "@/components/organisms/dashboard-standing-card";
import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { membresClasses, rdvNotes } from "@/lib/accord-fr";
import { libelleATravailler, libellePointFort } from "@/lib/competence-focus";
import { plurielFr } from "@/lib/pluriel-fr";
import type { TeamScopeGroup } from "@/lib/team-seller-scope";
import {
  formatDeltaOn5,
  formatNoteFr,
  rankLabel,
} from "@/src/core/domain/team-ranking";
import type { TeamMemberStanding } from "@/src/core/application/get-org-admin-dashboard";
import type { SellerSkillSignature } from "@/src/core/domain/seller-skill-signature";

/**
 * L'ouverture du tableau de bord du commercial : sa note en grand, son palier,
 * sa place, et le geste sur lequel progresser.
 *
 * C'est le point d'entrée de l'écran. Jusqu'ici sa note se lisait en petit, à
 * côté d'indicateurs d'activité écrits en gros : l'œil tombait sur le nombre de
 * rendez-vous avant de tomber sur la seule chose qui dit comment il vend. Le
 * hero remet la note au centre, avec le même vocabulaire que la vue manager :
 * même palier, même place, même point fort et même axe à travailler, tirés des
 * mêmes fonctions, si bien que le commercial et son manager ne lisent jamais
 * deux versions de la même personne.
 *
 * Le hero ne s'affiche qu'une fois la place vraiment établie : classé, et pas
 * seul à l'être. Dans les autres cas (hors classement, unique membre classé),
 * il n'y a pas de note à mettre en avant sans mentir, et la carte de position
 * détaillée reprend la main, avec ses phrases qui expliquent l'attente. Le hero
 * ne réécrit donc aucune des règles du classement : il met en scène le seul cas
 * où elles produisent un chiffre à célébrer, et délègue le reste.
 */
export function CommercialStandingHero({
  standing,
  comparisonGroup,
  managerNameLine,
  skillSignature,
  coachingHref,
}: {
  standing: TeamMemberStanding;
  comparisonGroup: TeamScopeGroup;
  managerNameLine: string | null;
  skillSignature: SellerSkillSignature | null;
  coachingHref: string;
}) {
  const row = standing.row;
  const moyenne = standing.ranking.averageNoteOn5;

  const heroLisible =
    row != null &&
    row.rank != null &&
    row.tier != null &&
    row.noteGlobaleOn5 != null &&
    row.deltaToTeamAverage != null &&
    moyenne != null &&
    standing.ranking.rankedCount > 1;

  // Hors du cas net, la carte détaillée reprend la main : elle porte les phrases
  // qui disent pourquoi il n'y a pas encore de rang, là où un grand chiffre
  // serait faux.
  if (!heroLisible) {
    return (
      <>
        <DashboardStandingCard
          standing={standing}
          comparisonGroup={comparisonGroup}
          managerNameLine={managerNameLine}
        />
        <CommercialCoachingFocus
          skillSignature={skillSignature}
          coachingHref={coachingHref}
        />
      </>
    );
  }

  const sousTitre = sousTitreDuGroupe(comparisonGroup, managerNameLine);

  // L'or ne pare que le sommet du classement : au palier Excellence, le hero
  // reçoit un filet et un halo dorés ; partout ailleurs il garde le halo de
  // marque. C'est la seule entorse au violet, et elle dit « haut du tableau »
  // sans toucher la rampe ordonnée des paliers.
  const estExcellence = row.tier?.id === "excellence";

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border bg-card shadow-sm dark:bg-zinc-900",
        estExcellence
          ? "border-gold/30 dark:border-gold/30"
          : "border-brand/15 dark:border-zinc-800",
      )}
    >
      {/*
        Au palier Excellence, un filet doré court en haut du hero, clippé par les
        coins arrondis. Décoratif, sans texte, il signe le haut du classement.
      */}
      {estExcellence ? (
        <span
          aria-hidden
          className="from-gold/50 via-gold to-gold/50 pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r"
        />
      ) : null}
      {/*
        Un halo, seule couleur de fond du hero : il en fait le point d'entrée de
        l'écran sans peser comme un aplat. Doré au palier Excellence, de marque
        sinon. Décoratif, posé derrière l'encre, qui reste sur le blanc qu'il
        effleure à peine.
      */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 -right-16 -z-10 size-56 rounded-full blur-3xl",
          estExcellence
            ? "bg-gold/15 dark:bg-gold/20"
            : "bg-brand/10 dark:bg-brand/20",
        )}
      />

      <div className="flex flex-col gap-5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6 sm:py-5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase dark:text-zinc-400">
            Ma position
          </span>
          <span
            className="truncate text-sm text-muted-foreground dark:text-zinc-400"
            title={sousTitre.title}
          >
            {sousTitre.texte}
          </span>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-5xl font-semibold tracking-tight text-foreground tabular-nums dark:text-zinc-50">
              {formatNoteFr(row.noteGlobaleOn5!)}
            </span>
            <span className="text-lg font-medium text-muted-foreground dark:text-zinc-500">
              /5
            </span>
          </p>
          <span className="text-xs text-muted-foreground dark:text-zinc-400">
            moyenne de {rdvNotes(row.scoredMeetings)}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <TeamTierBadge tier={row.tier} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground dark:bg-zinc-800 dark:text-zinc-100">
            <span className="tabular-nums">{rankLabel(row.rank!)}</span>
            <span className="font-normal text-muted-foreground dark:text-zinc-400">
              sur {standing.ranking.rankedCount} classés
            </span>
          </span>
          <span className="text-xs text-muted-foreground tabular-nums dark:text-zinc-400">
            {formatDeltaOn5(row.deltaToTeamAverage!)}{" "}
            {plurielFr(row.deltaToTeamAverage!, "point")} sur la moyenne de{" "}
            {membresClasses(standing.ranking.rankedCount)}
          </span>
        </div>
      </div>

      {/*
        Le focus, en pied du hero : la position dit où j'en suis, le focus dit
        sur quoi progresser. Même signal que la carte « à coacher » du manager.
      */}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 dark:border-zinc-800">
        {skillSignature ? (
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {libellePointFort(skillSignature)}
            </span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {libelleATravailler(skillSignature)}
            </span>
          </span>
        ) : (
          <span className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
            Analysez vos rendez-vous pour révéler votre point fort et votre axe
            de progression.
          </span>
        )}
        <Link
          href={coachingHref}
          className="focus-visible:ring-brand/60 text-brand inline-flex shrink-0 items-center gap-1 self-start rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-2 sm:self-auto"
        >
          Voir mon coaching détaillé
          <ArrowRight className="size-4 shrink-0" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

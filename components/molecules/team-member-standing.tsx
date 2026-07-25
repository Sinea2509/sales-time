import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { cn } from "@/lib/utils";
import { formatNoteOn5 } from "@/lib/format-note-on5";
import {
  formatDeltaOn5,
  formatNoteFr,
  rankLabel,
  unrankedExplanation,
} from "@/src/core/domain/team-ranking";
import type { TeamMemberStanding as TeamMemberStandingData } from "@/src/core/application/get-org-admin-dashboard";

function rdvNotes(n: number): string {
  return n <= 1 ? `${n} RDV noté` : `${n} RDV notés`;
}

function membresClasses(n: number): string {
  return n <= 1 ? `${n} membre classé` : `${n} membres classés`;
}

/**
 * Phrase de comparaison à la moyenne d'équipe.
 *
 * En français « point » ne prend la marque du pluriel qu'à partir de deux :
 * « 1,4 point », « 2 points ». La phrase se construit donc en entier ici plutôt
 * qu'en collant des morceaux dans le rendu, où l'accord passerait inaperçu.
 */
function phraseEcart(ecart: number, moyenne: number, rankedCount: number) {
  const reference = `la moyenne d'équipe (${formatNoteFr(
    moyenne,
  )}/5, calculée sur ${membresClasses(rankedCount)}).`;
  if (ecart === 0) return `Exactement à ${reference}`;
  const unite = Math.abs(ecart) >= 2 ? "points" : "point";
  return `${formatDeltaOn5(ecart)} ${unite} par rapport à ${reference}`;
}

/**
 * Note du commercial, avec le nombre de rendez-vous dont elle est la moyenne.
 *
 * Le suffixe dit « moyenne de 8 RDV notés » et non « sur 8 RDV notés » : la même
 * ligne annonce déjà « 1re place sur 7 », où « sur » veut dire « parmi ». Deux
 * sens du même mot à trois mots d'intervalle, et le lecteur croit lire 4,3 sur 8.
 */
function NoteAvecBase({
  note,
  scored,
}: {
  note: number | null;
  scored: number;
}) {
  return (
    <span
      className="text-xs font-medium text-zinc-700 tabular-nums dark:text-zinc-300"
      title={`Moyenne des SalesScores des ${rdvNotes(scored)} de la période.`}
    >
      {formatNoteOn5(note)}
      <span className="font-normal text-zinc-500 dark:text-zinc-400">
        {" "}
        · moyenne de {rdvNotes(scored)}
      </span>
    </span>
  );
}

/**
 * Rappel de la position d'un commercial sur sa fiche.
 *
 * Le manager arrive ici depuis un tableau qui vient d'annoncer une place, un
 * palier et une note. Une fiche qui n'en dit rien lui fait perdre le fil au
 * moment précis où il cherche quoi en faire. Les trois informations sont donc
 * reprises telles quelles, calculées par la même fonction que le tableau, si
 * bien qu'elles ne peuvent pas diverger.
 *
 * Hors classement, la fiche écrit la phrase entière au lieu de la cacher dans
 * une infobulle : c'est ici que se décide l'action, et l'action n'est pas la
 * même selon qu'il manque des analyses ou seulement du volume. Elle affiche
 * aussi la note, faute de quoi la phrase « le score reste affiché » désignerait
 * une colonne voisine qui n'existe que dans le tableau.
 */
export function TeamMemberStanding({
  standing,
  className,
}: {
  standing: TeamMemberStandingData;
  className?: string;
}) {
  const row = standing.row;
  if (!row) return null;

  const { ranking } = standing;
  const moyenne = ranking.averageNoteOn5;

  // Les deux branches partagent le même conteneur : l'appelant règle l'alignement
  // une seule fois, et il vaut aussi bien pour le rang que pour son absence.
  if (row.rank == null) {
    const sansNote = row.scoredMeetings === 0;
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {/* Sans aucune note il n'y a rien à montrer : la phrase le dit déjà. */}
        {sansNote ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <TeamTierBadge
              tier={null}
              unavailableTitle={unrankedExplanation(
                row.unrankedReason ?? "volume-insuffisant",
                row.scoredMeetings,
                ranking.minScoredMeetings,
              )}
            />
            <NoteAvecBase
              note={row.noteGlobaleOn5}
              scored={row.scoredMeetings}
            />
          </div>
        )}
        <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Hors classement.
          </span>{" "}
          {unrankedExplanation(
            row.unrankedReason ?? "sans-note",
            row.scoredMeetings,
            ranking.minScoredMeetings,
          )}
        </p>
      </div>
    );
  }

  const ecart = row.deltaToTeamAverage;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          title={`${rankLabel(row.rank)} parmi les ${membresClasses(
            ranking.rankedCount,
          )} de l'équipe${row.tied ? ", ex æquo" : ""}.`}
        >
          <span className="tabular-nums">{rankLabel(row.rank)}</span>
          {/*
            « sur 7 classés » et non « sur 7 » : la note « 4,3/5 » est écrite
            trois éléments plus loin sur la même ligne, et un nombre nu derrière
            « sur » s'y lirait comme le dénominateur d'une note. Le mot dit aussi
            que ces 7 ne sont pas l'équipe entière, qui en compte 10.
          */}
          <span className="font-normal text-zinc-500 dark:text-zinc-400">
            sur {ranking.rankedCount} classé{ranking.rankedCount > 1 ? "s" : ""}
          </span>
        </span>
        <TeamTierBadge tier={row.tier} />
        <NoteAvecBase note={row.noteGlobaleOn5} scored={row.scoredMeetings} />
      </div>
      {moyenne != null && ecart != null ? (
        <p className="text-muted-foreground text-[11px] leading-tight">
          {phraseEcart(ecart, moyenne, ranking.rankedCount)}
        </p>
      ) : null}
    </div>
  );
}

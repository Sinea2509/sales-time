import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import {
  formatDeltaOn5,
  rankLabel,
  unrankedExplanation,
  type MemberRanking,
} from "@/src/core/domain/team-ranking";

/**
 * Rang d'un membre au classement d'équipe.
 *
 * Un membre écarté du classement n'affiche pas un rang factice ni un tiret : il
 * affiche « n. c. » et l'infobulle dit pourquoi, avec le chiffre qui le justifie.
 * Tous les libellés s'accordent sur « place », un nom, jamais sur la personne.
 */
export function TeamRankCell({
  ranking,
  scoredMeetings,
  minScoredMeetings,
  className,
}: {
  ranking: Pick<
    MemberRanking,
    "rank" | "tied" | "deltaToTeamAverage" | "unrankedReason"
  >;
  scoredMeetings: number;
  minScoredMeetings: number;
  className?: string;
}) {
  if (ranking.rank == null) {
    const raison = ranking.unrankedReason ?? "sans-note";
    return (
      <span
        className={cn(
          "text-muted-foreground text-sm dark:text-zinc-400",
          className,
        )}
        title={unrankedExplanation(raison, scoredMeetings, minScoredMeetings)}
      >
        {VALEUR_NON_CALCULABLE}
      </span>
    );
  }

  const ecart = ranking.deltaToTeamAverage;
  const ecartTexte =
    ecart == null || ecart === 0 ? null : formatDeltaOn5(ecart);

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold tabular-nums text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        title={
          ranking.tied
            ? `${rankLabel(ranking.rank)}, ex æquo.`
            : rankLabel(ranking.rank)
        }
      >
        {ranking.rank}
      </span>
      {ecartTexte ? (
        // Masqué sur téléphone : à cette largeur la colonne doit tenir en une
        // pastille, et l'écart se relit sans lui, la moyenne d'équipe étant
        // rappelée dans le bandeau juste au-dessus et la note dans la colonne
        // voisine. Il revient dès la première taille où la place existe, et la
        // fiche du commercial l'écrit de toute façon en toutes lettres.
        <span
          className="text-muted-foreground hidden text-xs tabular-nums sm:inline dark:text-zinc-400"
          // « point sur 5 » se lirait « sur 5 » comme une note : un écart n'est
          // pas une note, il se dit en points de l'échelle, jamais sur elle.
          title={`Écart à la moyenne des membres classés : ${ecartTexte} point${
            Math.abs(ecart ?? 0) >= 2 ? "s" : ""
          } (échelle de 0 à 5).`}
        >
          {ecartTexte}
        </span>
      ) : null}
    </span>
  );
}

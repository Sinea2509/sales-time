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
 *
 * La première place est la seule marquée, et elle l'est en couleur de marque et
 * non en médaille : il n'y a ni or, ni argent, ni bronze, la deuxième place se
 * présentant exactement comme la septième. La couleur dit où commence la liste,
 * pas ce que vaut la personne. Le chiffre reste écrit dans la pastille, donc
 * elle n'est jamais seule à porter l'information.
 *
 * Contrastes calculés sur le thème clair, seul thème optimisé : blanc sur la
 * couleur de marque vaut 5,07:1 et violet 700 sur violet 100 vaut 6,15:1, tous
 * deux au-dessus du seuil de 4,5:1 exigé pour du petit texte.
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
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
          ranking.rank === 1
            ? "bg-brand text-white"
            : "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200",
        )}
        title={
          ranking.tied
            ? `${rankLabel(ranking.rank)}, ex æquo.`
            : rankLabel(ranking.rank)
        }
      >
        {ranking.rank}
      </span>
      {ecartTexte ? (
        // Masqué tant que le tableau est étroit : à cette largeur la colonne
        // doit tenir en une pastille, et l'écart se relit sans lui, la moyenne
        // d'équipe étant rappelée dans le bandeau juste au-dessus et la note
        // dans la colonne voisine. Il revient dès que la place existe, et la
        // fiche du commercial l'écrit de toute façon en toutes lettres.
        //
        // Le seuil se lit sur le bloc du tableau et non sur la fenêtre, et
        // c'est celui-là même qui commande la colonne « Palier ». Réglé sur la
        // fenêtre, l'écart revenait à 640px et portait la colonne de 64 à 92px,
        // y compris à 768px où le menu latéral venait de prendre 256px de
        // large. Cette cellule ne sert qu'au tableau : elle a donc toujours un
        // bloc de référence au-dessus d'elle.
        <span
          className="text-muted-foreground hidden text-xs tabular-nums @min-[580px]:inline dark:text-zinc-400"
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

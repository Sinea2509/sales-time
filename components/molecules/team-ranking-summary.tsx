import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import {
  formatNoteFr,
  type TeamRankingSummary as TeamRankingSummaryData,
} from "@/src/core/domain/team-ranking";

function membres(n: number): string {
  return n <= 1 ? `${n} membre` : `${n} membres`;
}

/**
 * Phrase des exclusions, une raison à la fois.
 *
 * Additionner « sans note » et « pas assez de notes » produirait une phrase
 * fausse pour la moitié des personnes concernées : la première attend qu'un
 * rendez-vous soit analysé, la seconde attend seulement du volume. Le manager
 * lit ici l'action, pas un total.
 */
function horsClassement(ranking: TeamRankingSummaryData): string | null {
  const raisons: string[] = [];
  if (ranking.unrankedLowVolumeCount > 0) {
    raisons.push(
      `${membres(ranking.unrankedLowVolumeCount)} sous le seuil de ${
        ranking.minScoredMeetings
      } rendez-vous notés`,
    );
  }
  if (ranking.unrankedNoScoreCount > 0) {
    raisons.push(
      `${membres(ranking.unrankedNoScoreCount)} sans aucun rendez-vous noté`,
    );
  }
  return raisons.length === 0
    ? null
    : `hors classement : ${raisons.join(", ")}`;
}

/**
 * L'en-tête de lecture du classement : la référence, qui la compose, et qui en
 * est écarté, avec la raison. Sans elle, un rang est un nombre sans échelle.
 *
 * Sans cadre à elle : elle coiffe la piste de répartition, dans la carte de
 * celle-ci. La moyenne annoncée ici est le trait vertical dessiné dix pixels
 * plus bas, et deux cadres l'un sur l'autre auraient séparé un chiffre de sa
 * propre illustration.
 *
 * L'échelle des paliers n'est pas répétée non plus : la piste dessine les
 * quatre paliers à leur vraie place sur l'axe des notes, ce qu'une rangée
 * d'insignes ne fait pas, elle qui garde ses bornes dans une infobulle qu'un
 * doigt n'ouvre pas.
 */
export function TeamRankingSummary({
  ranking,
  totalCount,
}: {
  ranking: TeamRankingSummaryData;
  totalCount: number;
}) {
  const moyenne = ranking.averageNoteOn5;
  const exclusions = horsClassement(ranking);
  // Jamais un nombre nu derrière « sur » : cette ligne suit immédiatement une
  // note écrite « 3,2/5 », et « classés sur 10 » s'y lit alors « notés sur 10 ».
  // Les deux effectifs sont donc annoncés séparément, du total vers les classés.
  const base =
    ranking.rankedCount === 0
      ? `équipe de ${membres(totalCount)} · aucun membre classé pour l'instant`
      : `équipe de ${membres(totalCount)} · moyenne des ${membres(
          ranking.rankedCount,
        )} classés`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          Moyenne d&apos;équipe
        </span>
        <span
          className="text-2xl font-semibold text-zinc-950 tabular-nums dark:text-zinc-50"
          title={
            moyenne == null
              ? "Aucun membre classé : la moyenne n'a pas de base de calcul."
              : `Moyenne des notes affichées des ${membres(
                  ranking.rankedCount,
                )} au classement.`
          }
        >
          {moyenne == null
            ? VALEUR_NON_CALCULABLE
            : `${formatNoteFr(moyenne)}/5`}
        </span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {base}
        {exclusions ? ` · ${exclusions}` : null}
      </p>
    </div>
  );
}

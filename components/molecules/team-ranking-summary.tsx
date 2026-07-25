import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import {
  RANKING_TIERS,
  formatNoteFr,
  tierRangeLabel,
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
 * Bandeau de lecture du classement d'équipe : la référence, qui la compose, qui
 * en est écarté et pourquoi, et ce que signifient les paliers. Sans lui, un rang
 * est un nombre sans échelle.
 */
export function TeamRankingSummary({
  ranking,
  totalCount,
  className,
}: {
  ranking: TeamRankingSummaryData;
  totalCount: number;
  className?: string;
}) {
  const moyenne = ranking.averageNoteOn5;
  const exclusions = horsClassement(ranking);
  const base =
    ranking.rankedCount === 0
      ? "aucun membre classé pour l'instant"
      : `moyenne des ${membres(ranking.rankedCount)} classés sur ${totalCount}`;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            Moyenne d&apos;équipe
          </span>
          <span
            className="text-lg font-semibold text-zinc-950 tabular-nums dark:text-zinc-50"
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Paliers :
          </span>
          <ul
            className="flex flex-wrap items-center gap-1.5"
            aria-label="Paliers de note"
          >
            {RANKING_TIERS.map((tier) => (
              <li key={tier.id} title={tierRangeLabel(tier)}>
                <TeamTierBadge tier={tier} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {base}
        {exclusions ? ` · ${exclusions}` : null}
      </p>
    </div>
  );
}

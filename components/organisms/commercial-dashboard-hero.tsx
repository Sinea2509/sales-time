import { Link } from "@/i18n/navigation";
import { SalesScoreRing } from "@/components/molecules/sales-score-ring";
import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { rdvNotes } from "@/lib/accord-fr";
import { plurielFr } from "@/lib/pluriel-fr";
import { statsWindowLabel } from "@/lib/stats-window-labels";
import { cn } from "@/lib/utils";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import type { SellerWeeklyChallenge } from "@/src/core/domain/seller-dashboard-focus";
import { rankLabel, tierFromSalesScore } from "@/src/core/domain/team-ranking";

const SALES_SCORE_HOW =
  "Le SalesScore d'un rendez-vous est la moyenne des six leviers SONCAS entendus chez le prospect, de 0 à 100. Votre SalesScore est la moyenne de vos rendez-vous analysés sur la période. Paliers : Démarrage jusqu'à 40, Progression jusqu'à 60, Maîtrise jusqu'à 80, Excellence au-delà.";

/**
 * L'ouverture du tableau de bord du commercial, comme la maquette du 11
 * septembre la dessine : l'anneau du SalesScore, son palier, son évolution,
 * et à droite le défi de la semaine repris de son dernier rendez-vous noté.
 *
 * Le rang dans l'équipe reste dit, en une pastille : c'est la seule chose
 * que le commercial ne peut pas lire sur ses propres rendez-vous.
 */
export function CommercialDashboardHero({
  salesScoreAvg,
  scoredMeetings,
  statsWindowDays,
  trendPoints,
  rank,
  challenge,
  pending = false,
}: {
  salesScoreAvg: number | null;
  scoredMeetings: number;
  statsWindowDays: StatsWindowDays;
  /** Écart en points avec la période précédente, `null` sans comparaison. */
  trendPoints: number | null;
  /** Place dans l'équipe, quand elle est établie. */
  rank: { rank: number; rankedCount: number } | null;
  challenge: SellerWeeklyChallenge | null;
  pending?: boolean;
}) {
  const tier = tierFromSalesScore(salesScoreAvg);

  return (
    <div className="border-border bg-card flex flex-col gap-6 rounded-2xl border px-5 py-5 shadow-sm lg:flex-row lg:items-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-6">
        <SalesScoreRing
          score={salesScoreAvg}
          pending={pending}
          size={132}
          stroke={11}
        />
        <div className="min-w-0 space-y-2">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Votre SalesScore, sur 100
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {salesScoreAvg == null ? (
              <span className="text-muted-foreground text-sm">
                Pas encore classé
              </span>
            ) : (
              <TeamTierBadge tier={tier} />
            )}
            {trendPoints != null && trendPoints !== 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
                  trendPoints > 0
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-100",
                )}
                title="Écart avec la période précédente, en points sur 100"
              >
                <span aria-hidden>{trendPoints > 0 ? "▲" : "▼"}</span>
                {trendPoints > 0 ? "+" : ""}
                {trendPoints} {plurielFr(trendPoints, "pt", "pts")}
              </span>
            ) : null}
            {rank ? (
              <span className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold dark:bg-zinc-800">
                <span className="tabular-nums">{rankLabel(rank.rank)}</span>
                <span className="text-muted-foreground font-normal">
                  sur {rank.rankedCount}
                </span>
              </span>
            ) : null}
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="text-muted-foreground hover:text-foreground focus-visible:ring-brand-ring rounded-sm text-xs underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2"
              >
                comment c&apos;est calculé ?
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="max-w-sm text-left leading-relaxed"
              >
                {SALES_SCORE_HOW}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {scoredMeetings > 0
              ? `Moyenne de vos ${rdvNotes(scoredMeetings)} sur les ${statsWindowLabel(statsWindowDays)}.`
              : `Aucun rendez-vous analysé sur les ${statsWindowLabel(statsWindowDays)} : analysez-en un pour obtenir votre score.`}
          </p>
        </div>
      </div>

      <div className="border-brand/25 bg-brand-soft/60 w-full rounded-xl border p-4 lg:ml-auto lg:max-w-[340px] dark:bg-brand/10">
        <p className="text-brand-hover dark:text-brand-muted text-[11px] font-semibold tracking-wider uppercase">
          Défi de la semaine
        </p>
        {challenge ? (
          <>
            <p className="mt-1.5 text-sm leading-relaxed">{challenge.text}</p>
            <Link
              href={`/company/rendez-vous/${challenge.meetingId}`}
              className="text-brand-hover dark:text-brand-muted mt-2 inline-block text-xs font-semibold hover:underline"
            >
              Repris du rendez-vous {challenge.from}
            </Link>
          </>
        ) : (
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            Votre prochain rendez-vous de découverte analysé vous donnera un
            défi à relever, tiré de sa scorecard.
          </p>
        )}
      </div>
    </div>
  );
}

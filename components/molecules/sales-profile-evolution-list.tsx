import { KpiVsPreviousBadge } from "@/components/molecules/trend-pill";
import {
  MIN_RDV_FOR_STATS,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import {
  salesProfileEvolution,
  salesProfileOverallEvolution,
} from "@/src/core/domain/sales-profile-evolution";
import { SELLER_SKILL_LABEL_FR } from "@/src/core/domain/seller-skill-signature";
import type { SalesProfileScores } from "@/src/core/domain/sales-profile-from-meetings";

/**
 * Le radar dit la forme, ce tableau dit les nombres.
 *
 * Le radar superpose deux aires, « actuel » et « précédent », mais on y lit un
 * mouvement sans jamais son ampleur : combien la compétence a-t-elle progressé
 * ou reculé ? Chaque ligne porte donc la note sur cent et, à côté, la variation
 * relative en pourcentage face à la période précédente, dans le même badge
 * « vs N j. préc. » que les cartes de KPI, pour que « croissance » et
 * « décroissance » se lisent en clair.
 *
 * Le badge se tait de lui-même quand l'échantillon est trop mince pour qu'une
 * tendance veuille dire quelque chose, ou quand il n'y a pas de période
 * précédente : mieux vaut une note nue qu'un pourcentage tiré de deux
 * rendez-vous. Quand aucune comparaison n'est possible, une ligne le dit, faute
 * de quoi l'absence de badge se lirait comme une stagnation.
 */
export function SalesProfileEvolutionList({
  scores,
  previousScores,
  rdvCount,
  statsWindowDays,
}: {
  scores: SalesProfileScores;
  previousScores: SalesProfileScores | null;
  rdvCount: number;
  statsWindowDays?: StatsWindowDays;
}) {
  const evolution = salesProfileEvolution(scores, previousScores);
  const overall = salesProfileOverallEvolution(scores, previousScores);

  const badge = (deltaPct: number | null) => (
    <KpiVsPreviousBadge
      delta={deltaPct}
      mode="up-good"
      currentSampleCount={rdvCount}
      minSampleCount={MIN_RDV_FOR_STATS}
      statsWindowDays={statsWindowDays}
    />
  );

  const note = (value: number) => (
    <span className="text-foreground text-sm tabular-nums">
      {value}
      <span className="text-muted-foreground text-xs"> /100</span>
    </span>
  );

  return (
    <div className="border-border mt-5 border-t pt-4">
      <div className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
        Croissance par compétence
      </div>

      <div className="flex items-center justify-between gap-3 pb-2">
        <span className="text-foreground text-sm font-semibold">
          Profil global
        </span>
        <div className="flex items-center gap-2">
          {note(overall.currentAverage)}
          {badge(overall.deltaPct)}
        </div>
      </div>

      <ul className="border-border divide-border divide-y border-t">
        {evolution.map((dimension) => (
          <li
            key={dimension.key}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span className="text-muted-foreground min-w-0 truncate text-sm">
              {SELLER_SKILL_LABEL_FR[dimension.key]}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              {note(dimension.current)}
              {badge(dimension.deltaPct)}
            </div>
          </li>
        ))}
      </ul>

      {previousScores === null ? (
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
          Pas encore de période précédente à comparer : la croissance apparaîtra
          dès qu&apos;une période complète la précède.
        </p>
      ) : null}
    </div>
  );
}

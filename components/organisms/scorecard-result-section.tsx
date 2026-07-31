import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  cardProseBodyClass,
  cardSubsectionTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import {
  salesScoreBarClass,
  salesScoreColorClass,
} from "@/lib/sales-score-color";
import { cn } from "@/lib/utils";
import {
  SCORECARD_LEVEL_MAX,
  SCORECARD_TOTAL,
} from "@/src/core/domain/scorecard-grid";
import type { ScorecardAnalysisResult } from "@/src/core/domain/scorecard-result-zod";
import {
  scorecardResultView,
  type ScorecardBlockView,
} from "@/src/core/domain/scorecard-result-view";

/**
 * La scorecard du rendez-vous, telle que le commercial la lit.
 *
 * La section ne calcule rien : `scorecardResultView` prépare tout, et ce
 * fichier ne fait que placer. C'est la règle de l'architecture, et elle a ici
 * une raison précise : le score affiché doit être celui qui compte, et une
 * moyenne bricolée dans du JSX ne se teste pas.
 *
 * Ce qu'elle n'affiche pas, volontairement : les listes Keep, Improve et Stop
 * que le schéma de la scorecard porte aussi. Le bloc « Coaching KISS » les
 * montre déjà, trois sections plus haut, sous les mêmes intitulés. Deux listes
 * « Keep » sur une même page obligeraient le commercial à choisir laquelle
 * suivre, sans rien pour choisir. La question reste ouverte, et elle se
 * tranchera d'un côté ou de l'autre : soit ces trois champs sortent du schéma
 * de la scorecard, soit la scorecard remplace le bloc KISS pour les
 * rendez-vous qui ont une grille. Les garder dans le schéma sans les afficher
 * est l'état provisoire, pas la réponse.
 */

/**
 * « Note » et non « SalesScore ».
 *
 * L'en-tête de la fiche affiche déjà un SalesScore, calculé lui à partir des
 * motivations SONCAS. Deux nombres de 0 à 100 sur le même écran, portant le
 * même nom et ne mesurant pas la même chose, se liraient comme une
 * contradiction du produit avec lui-même. Le palier, lui, est partagé
 * exprès : c'est le vocabulaire commun de toutes les notes sur 100.
 */
const TITRE_NOTE = "Note du rendez-vous";

function BlockGauge({ block }: { block: ScorecardBlockView }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={cardSubsectionTitleClass}>{block.name}</span>
        <span className="text-muted-foreground text-sm tabular-nums">
          <span
            className={cn("font-semibold", salesScoreColorClass(block.percent))}
          >
            {block.score}
          </span>{" "}
          / {block.max}
        </span>
      </div>
      {/*
        La barre est décorative : le rapport chiffré est écrit juste au-dessus,
        si bien que la couleur ne porte jamais seule l'information.
      */}
      <span
        className="block h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800"
        aria-hidden
      >
        <span
          className={cn(
            "block h-full rounded-full",
            salesScoreBarClass(block.percent),
          )}
          style={{ width: `${block.percent}%` }}
        />
      </span>
    </div>
  );
}

function BlockDetail({ block }: { block: ScorecardBlockView }) {
  if (block.criteria.length === 0) return null;

  return (
    <details className="border-border rounded-lg border">
      <summary className="text-muted-foreground cursor-pointer px-4 py-2.5 text-sm">
        Voir le détail de « {block.name} »
      </summary>
      <ul className="border-border space-y-3 border-t p-4">
        {block.criteria.map((criterion) => (
          <li key={criterion.key} className="space-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm font-medium">{criterion.label}</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {criterion.level} / {SCORECARD_LEVEL_MAX}
              </span>
            </div>
            {criterion.evidence.length > 0 ? (
              <ul className="text-muted-foreground space-y-1 text-xs leading-relaxed">
                {criterion.evidence.map((quote) => (
                  <li key={quote} className="break-words italic">
                    « {quote} »
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ScorecardResultSection({
  result,
}: {
  result: ScorecardAnalysisResult;
}) {
  const view = scorecardResultView(result);

  return (
    <section className="space-y-3">
      <h2 className={sectionHeadingClass}>Scorecard : {view.gridName}</h2>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">{TITRE_NOTE}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                className={cn(
                  "text-3xl font-semibold tabular-nums",
                  salesScoreColorClass(view.overallScore),
                )}
              >
                {view.overallScore}
              </span>
              <span className="text-muted-foreground text-sm">
                / {SCORECARD_TOTAL}
              </span>
              <TeamTierBadge
                tier={view.tier}
                unavailableTitle={
                  "Palier non décerné : la note de ce rendez-vous n'a pas pu être située."
                }
              />
            </div>
            <p className={cardProseBodyClass}>{view.summary}</p>
          </div>

          <div className="space-y-4">
            {view.blocks.map((block) => (
              <div key={block.key} className="space-y-2">
                <BlockGauge block={block} />
                <BlockDetail block={block} />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className={cardSubsectionTitleClass}>Points perdus</h3>
            {view.pointsLost.length > 0 ? (
              <ul className="space-y-3">
                {view.pointsLost.map((point) => (
                  <li
                    key={point.key}
                    className="border-border space-y-1 rounded-lg border p-3"
                  >
                    <p className="text-sm font-medium">{point.label}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {point.evidence}
                    </p>
                    <p className="text-sm leading-relaxed">
                      <span className="font-medium">À dire à la place : </span>
                      {point.whatToSayInstead}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Aucun point perdu relevé sur ce rendez-vous.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-border space-y-1 rounded-lg border p-3">
              <h3 className={cardSubsectionTitleClass}>
                La question qui manquait
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {view.goldenQuestion}
              </p>
            </div>
            <div className="border-border space-y-1 rounded-lg border p-3">
              <h3 className={cardSubsectionTitleClass}>
                Le défi du prochain rendez-vous
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {view.challenge}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

import { ToneChip } from "@/components/atoms/tone-chip";
import { LevelPips } from "@/components/molecules/level-pips";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { plurielFr } from "@/lib/pluriel-fr";
import { cn } from "@/lib/utils";
import { SCORECARD_LEVEL_MAX } from "@/src/core/domain/scorecard-grid";
import type { ScorecardAnalysisResult } from "@/src/core/domain/scorecard-result-zod";
import {
  scorecardResultView,
  type ScorecardBlockView,
  type ScorecardPointLostView,
} from "@/src/core/domain/scorecard-result-view";

/**
 * Un bloc se retrouve à sa lettre, d'un endroit de la fiche à l'autre. Elle
 * est en bleu nuit et la barre en bleu de marque, pour tous les blocs : une
 * couleur par bloc faisait de la fiche un sapin de Noël (retour de Thomas du
 * 28 octobre 2026).
 */
function BlockLetter({ letter, size = 26 }: { letter: string; size?: number }) {
  return (
    <span
      className="bg-night flex shrink-0 items-center justify-center rounded-md text-[12.5px] font-extrabold text-white"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {letter}
    </span>
  );
}

/**
 * Un critère : ce qui a été obtenu, ce qui manque (une seule fois), les
 * citations, puis « Mon conseil » à 2 sur 4 ou moins.
 */
function CriterionRow({
  criterion,
}: {
  criterion: ScorecardBlockView["criteria"][number];
}) {
  return (
    <div className="border-b border-dashed border-border py-2.5 last:border-b-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-medium">
            {criterion.key}. {criterion.label}
          </div>
          {criterion.coverage ? (
            <div className="text-muted-foreground mt-0.5 text-[11.5px]">
              {criterion.coverage}
            </div>
          ) : null}
        </div>
        {criterion.unobservable ? (
          <span className="text-muted-foreground col-span-2 text-right text-[11.5px] font-semibold">
            hors score
          </span>
        ) : (
          <>
            <LevelPips level={criterion.level} max={SCORECARD_LEVEL_MAX} />
            <span className="w-9 text-right text-[12.5px] font-semibold tabular-nums">
              {criterion.level}/{SCORECARD_LEVEL_MAX}
            </span>
          </>
        )}
      </div>
      {criterion.learned || criterion.missing ? (
        <div className="mt-1.5 space-y-0.5 text-[12.5px] leading-relaxed">
          {criterion.learned ? (
            <p>
              <span className="font-semibold">Obtenu : </span>
              {criterion.learned}
            </p>
          ) : null}
          {criterion.missing ? (
            <p className="text-muted-foreground">
              <span className="font-semibold">Manque : </span>
              {criterion.missing}
            </p>
          ) : null}
        </div>
      ) : null}
      {criterion.evidence.length > 0 ? (
        <ul className="text-muted-foreground mt-1.5 space-y-1 text-xs leading-relaxed">
          {criterion.evidence.map((quote, index) => (
            <li key={`${index}-${quote}`} className="italic">
              « {quote} »
            </li>
          ))}
        </ul>
      ) : null}
      {criterion.advice ? (
        <p className="bg-brand-soft mt-2 rounded-lg px-3 py-2 text-[12.8px] leading-relaxed">
          <b>Mon conseil :</b> {criterion.advice}
        </p>
      ) : null}
    </div>
  );
}

function BlockDetails({
  block,
  lostByKey,
}: {
  block: ScorecardBlockView;
  lostByKey: ReadonlyMap<string, ScorecardPointLostView>;
}) {
  const missing = block.criteria.filter((c) =>
    lostByKey.has(c.key.toUpperCase()),
  ).length;
  return (
    <details className="group rounded-lg border border-border bg-card open:border-border open:shadow-sm">
      <summary className="grid cursor-pointer list-none grid-cols-[26px_minmax(120px,1.35fr)_minmax(90px,1fr)_62px_16px] items-center gap-3 px-3.5 py-3 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
        <BlockLetter letter={block.key} />
        <span className="text-[13.4px] font-semibold">{block.name}</span>
        <span className="block h-[11px] overflow-hidden rounded-[6px] bg-border">
          <span
            className="st-bar bg-brand block h-full rounded-[6px]"
            style={{ width: `${block.percent}%` }}
          />
        </span>
        <span className="text-right text-[12.5px] font-bold tabular-nums">
          {block.score}
          <span className="text-muted-foreground font-normal">
            {" "}
            / {block.max}
          </span>
        </span>
        <span
          className="text-muted-foreground text-[11px] transition-transform group-open:rotate-180"
          aria-hidden
        >
          ▾
        </span>
      </summary>
      <div className="border-t border-border px-3.5 pt-0.5 pb-3">
        <p className="text-muted-foreground mb-2.5 text-xs">
          {block.criteria.length} critères, évalués de 0 à {SCORECARD_LEVEL_MAX}{" "}
          sur ce qui s&apos;entend dans le transcript.
          {missing > 0
            ? ` ${missing} ${plurielFr(missing, "critère a", "critères ont")} coûté des points sur ce rendez-vous.`
            : ""}
        </p>
        {block.criteria.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Le détail par critère n&apos;est plus lisible : cette grille a été
            retirée du produit.
          </p>
        ) : (
          block.criteria.map((criterion) => (
            <CriterionRow key={criterion.key} criterion={criterion} />
          ))
        )}
      </div>
    </details>
  );
}

function PointsToGain({
  points,
  levels,
}: {
  points: readonly ScorecardPointLostView[];
  levels: ReadonlyMap<string, number>;
}) {
  if (points.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className={cardTitleClass}>Où gagner des points</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Aucun critère en retrait sur ce rendez-vous : rien à gagner de plus
            ici.
          </p>
        </CardContent>
      </Card>
    );
  }
  const possible = points.reduce(
    (acc, p) => acc + (SCORECARD_LEVEL_MAX - (levels.get(p.key) ?? 0)),
    0,
  );
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0">
            <h2 className={cardTitleClass}>Où gagner des points</h2>
            <p className="text-muted-foreground mt-1 max-w-[64ch] text-xs leading-relaxed">
              Les critères où ce rendez-vous laisse le plus de marge, du plus
              important au moins important. Pour chacun, mon conseil pour la
              prochaine fois.
            </p>
          </div>
          <span className="flex-1" />
          <ToneChip tone="brand">
            {possible} {plurielFr(possible, "point")} à portée
          </ToneChip>
        </div>
        <div className="grid gap-3">
          {points.map((p) => {
            const level = levels.get(p.key) ?? 0;
            return (
              <div
                key={p.key}
                className="rounded-lg border border-border px-3.5 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <BlockLetter letter={p.key.charAt(0)} size={22} />
                  <b className="text-[12.5px]">
                    {p.key}, {p.label}
                  </b>
                  <ToneChip>
                    niveau {level} sur {SCORECARD_LEVEL_MAX}
                  </ToneChip>
                  <ToneChip>
                    +{SCORECARD_LEVEL_MAX - level}{" "}
                    {plurielFr(
                      SCORECARD_LEVEL_MAX - level,
                      "point possible",
                      "points possibles",
                    )}
                  </ToneChip>
                </div>
                <p className="text-muted-foreground my-2 text-[12.8px] leading-relaxed">
                  {p.evidence}
                </p>
                <p className="bg-brand-soft rounded-lg px-3 py-2 text-[12.8px] leading-relaxed">
                  <b>Mon conseil :</b> {p.whatToSayInstead}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * L'onglet « Mon SalesScore » : la grille bloc par bloc, chaque bloc
 * dépliable jusqu'à ses critères et à ce qui a manqué, puis les points à
 * portée. La section ne calcule rien : `scorecardResultView` prépare tout.
 */
export function ScorecardResultSection({
  result,
  gridAssumed,
  gridIntent,
}: {
  result: ScorecardAnalysisResult;
  /** Vrai quand le rendez-vous n'avait pas de type et a reçu la grille par défaut. */
  gridAssumed: boolean;
  gridIntent: string | null;
}) {
  const view = scorecardResultView(result);
  const lostByKey = new Map(view.pointsLost.map((p) => [p.key, p]));
  const levels = new Map<string, number>();
  for (const block of view.blocks) {
    for (const c of block.criteria) {
      levels.set(c.key.toUpperCase(), c.level);
    }
  }

  return (
    <div className="space-y-4">
      {gridAssumed ? (
        <Card className="bg-muted/60 border-border shadow-none">
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <ToneChip tone="warn">Grille par défaut</ToneChip>
            <span className="text-[12.5px] leading-relaxed">
              Ce rendez-vous n&apos;a pas de type : il est évalué sur la grille
              de découverte. Renseignez le type pour que la grille suive.
            </span>
          </CardContent>
        </Card>
      ) : null}

      {result.speakers === "guessed" || result.speakers === "none" ? (
        <Card className="bg-muted/60 border-border shadow-none">
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <ToneChip tone="warn">
              {result.speakers === "guessed"
                ? "Commercial deviné"
                : "Intervenants non distingués"}
            </ToneChip>
            <span className="text-[12.5px] leading-relaxed">
              {result.speakers === "guessed"
                ? "Ce transcript ne dit pas qui vous êtes : je vous ai reconnu à l'ordre de parole. Je n'ai donc mesuré ni votre écoute, ni vos questions sur ce rendez-vous."
                : "Je n'ai pas pu distinguer qui parle dans ce transcript. Je n'ai donc mesuré ni votre écoute, ni vos questions sur ce rendez-vous."}{" "}
              Pour que je le fasse, chaque réplique doit commencer par «
              Commercial : » ou « Prospect : », ou porter votre nom tel
              qu&apos;il est écrit dans votre profil.
            </span>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div>
            <h2 className={cardTitleClass}>
              Mon SalesScore détaillé sur ce rendez-vous
            </h2>
            <p className="text-muted-foreground mt-1 max-w-[64ch] text-xs leading-relaxed">
              {gridIntent ? `${gridIntent} ` : ""}
              Ouvrez un bloc pour voir ses critères et ce qui a manqué.
            </p>
            <details className="mt-2 max-w-[70ch] text-xs leading-relaxed">
              <summary className="text-brand cursor-pointer font-semibold">
                Comment le score est calculé
              </summary>
              <p className="text-muted-foreground mt-1.5">
                Chaque critère vaut de 0 à 4 points. Je regarde deux choses :
                avez-vous abordé le thème, l&apos;avez-vous creusé, et
                qu&apos;avez-vous obtenu de votre interlocuteur ? Un thème
                seulement abordé rapporte 1 ou 2 points ; un thème creusé avec
                une réponse précise en rapporte 4. La formulation de la question
                ne compte pas, seul le thème compte. Je vérifie chaque citation
                dans le transcript, avec la personne qui l&apos;a dite : une
                citation introuvable fait baisser le score, jamais monter. Votre
                écoute et vos questions se mesurent sur le transcript, quand je
                vous y reconnais. Le même transcript relu deux fois reçoit le
                même score.
              </p>
            </details>
          </div>
          <p className={cn("text-[13.5px] leading-relaxed")}>{view.summary}</p>
          <div className="grid gap-2.5">
            {view.blocks.map((block) => (
              <BlockDetails
                key={block.key}
                block={block}
                lostByKey={lostByKey}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <PointsToGain points={view.pointsLost} levels={levels} />
    </div>
  );
}

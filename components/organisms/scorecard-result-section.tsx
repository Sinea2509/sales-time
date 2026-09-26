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
 * Une couleur par bloc de la grille, du contexte à l'engagement. Les
 * lettres sont écrites à côté ; la couleur ne fait que retrouver un bloc
 * d'un coup d'œil d'un endroit de la fiche à l'autre.
 */
const BLOCK_COLORS = ["#6C4DFF", "#2F6FB5", "#C08A1E", "#2E9E5B", "#C93B3B"];

function blockColor(index: number): string {
  return BLOCK_COLORS[index % BLOCK_COLORS.length] ?? BLOCK_COLORS[0];
}

function BlockLetter({
  letter,
  color,
  size = 26,
}: {
  letter: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-md text-[12.5px] font-extrabold text-white"
      style={{ width: size, height: size, background: color }}
      aria-hidden
    >
      {letter}
    </span>
  );
}

function CriterionRow({
  criterion,
  lost,
  color,
}: {
  criterion: ScorecardBlockView["criteria"][number];
  lost: ScorecardPointLostView | undefined;
  color: string;
}) {
  return (
    <div className="border-b border-dashed border-border py-2.5 last:border-b-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
        <div className="text-[13px] font-medium">
          {criterion.key}. {criterion.label}
        </div>
        <LevelPips level={criterion.level} max={SCORECARD_LEVEL_MAX} />
        <span className="w-9 text-right text-[12.5px] font-semibold tabular-nums">
          {criterion.level}/{SCORECARD_LEVEL_MAX}
        </span>
      </div>
      {lost ? (
        <div
          className="mt-2 rounded-r-lg bg-muted/40 px-3.5 py-2.5"
          style={{ borderLeft: `3px solid ${color}` }}
        >
          <p className="text-[11.5px] font-bold" style={{ color }}>
            Ce qui a manqué
          </p>
          <p className="text-muted-foreground mt-1.5 text-[12.8px] leading-relaxed">
            {lost.evidence}
          </p>
          <p className="mt-2 rounded-r-lg border-l-[3px] border-emerald-600 bg-emerald-50 px-3 py-2 text-[12.8px] leading-relaxed dark:bg-emerald-950/40">
            <b>Notre suggestion :</b> {lost.whatToSayInstead}
          </p>
        </div>
      ) : criterion.evidence.length > 0 ? (
        <ul className="text-muted-foreground mt-1.5 space-y-1 text-xs leading-relaxed">
          {criterion.evidence.map((quote) => (
            <li key={quote} className="italic">
              « {quote} »
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function BlockDetails({
  block,
  index,
  lostByKey,
}: {
  block: ScorecardBlockView;
  index: number;
  lostByKey: ReadonlyMap<string, ScorecardPointLostView>;
}) {
  const color = blockColor(index);
  const missing = block.criteria.filter((c) =>
    lostByKey.has(c.key.toUpperCase()),
  ).length;
  return (
    <details className="group rounded-lg border border-border bg-card open:border-border open:shadow-sm">
      <summary className="grid cursor-pointer list-none grid-cols-[26px_minmax(120px,1.35fr)_minmax(90px,1fr)_62px_16px] items-center gap-3 px-3.5 py-3 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
        <BlockLetter letter={block.key} color={color} />
        <span className="text-[13.4px] font-semibold">{block.name}</span>
        <span className="block h-[11px] overflow-hidden rounded-[6px] bg-border">
          <span
            className="block h-full rounded-[6px]"
            style={{ width: `${block.percent}%`, background: color }}
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
          {block.criteria.length} critères, notés de 0 à {SCORECARD_LEVEL_MAX}{" "}
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
            <CriterionRow
              key={criterion.key}
              criterion={criterion}
              lost={lostByKey.get(criterion.key.toUpperCase())}
              color={color}
            />
          ))
        )}
      </div>
    </details>
  );
}

function PointsToGain({
  points,
  levels,
  colorByKey,
}: {
  points: readonly ScorecardPointLostView[];
  levels: ReadonlyMap<string, number>;
  colorByKey: ReadonlyMap<string, string>;
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
              important au moins important. Chacun porte notre suggestion pour
              la prochaine fois.
            </p>
          </div>
          <span className="flex-1" />
          <ToneChip tone="brand">
            {possible} {plurielFr(possible, "point")} à portée
          </ToneChip>
        </div>
        <div className="grid gap-3">
          {points.map((p) => {
            const color = colorByKey.get(p.key) ?? BLOCK_COLORS[0];
            const level = levels.get(p.key) ?? 0;
            return (
              <div
                key={p.key}
                className="rounded-lg border border-border px-3.5 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <BlockLetter
                    letter={p.key.charAt(0)}
                    color={color}
                    size={22}
                  />
                  <b className="text-[12.5px]">
                    {p.key}, {p.label}
                  </b>
                  <ToneChip>
                    niveau {level} sur {SCORECARD_LEVEL_MAX}
                  </ToneChip>
                  <ToneChip className="bg-card" tone="neutral">
                    <span style={{ color }}>
                      +{SCORECARD_LEVEL_MAX - level}{" "}
                      {plurielFr(
                        SCORECARD_LEVEL_MAX - level,
                        "point possible",
                        "points possibles",
                      )}
                    </span>
                  </ToneChip>
                </div>
                <p className="text-muted-foreground my-2 text-[12.8px] leading-relaxed">
                  {p.evidence}
                </p>
                <p className="rounded-r-lg border-l-[3px] border-emerald-600 bg-emerald-50 px-3 py-2 text-[12.8px] leading-relaxed dark:bg-emerald-950/40">
                  <b>Notre suggestion :</b> {p.whatToSayInstead}
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
  const colorByKey = new Map<string, string>();
  view.blocks.forEach((block, i) => {
    for (const c of block.criteria) {
      levels.set(c.key.toUpperCase(), c.level);
      colorByKey.set(c.key.toUpperCase(), blockColor(i));
    }
  });

  return (
    <div className="space-y-4">
      {gridAssumed ? (
        <Card className="border-amber-200 bg-amber-50 shadow-none dark:border-amber-800 dark:bg-amber-950/40">
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <ToneChip tone="warn">Grille par défaut</ToneChip>
            <span className="text-[12.5px] leading-relaxed">
              Ce rendez-vous n&apos;a pas de type : il est noté sur la grille de
              découverte. Renseignez le type pour que la grille suive.
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
          </div>
          <p className={cn("text-[13.5px] leading-relaxed")}>{view.summary}</p>
          <div className="grid gap-2.5">
            {view.blocks.map((block, i) => (
              <BlockDetails
                key={block.key}
                block={block}
                index={i}
                lostByKey={lostByKey}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <PointsToGain
        points={view.pointsLost}
        levels={levels}
        colorByKey={colorByKey}
      />
    </div>
  );
}

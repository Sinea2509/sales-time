import { scorecardCriteria, scorecardGridById } from "./scorecard-grid";
import type { ScorecardGrid } from "./scorecard-grid";
import type {
  ScorecardAnalysisResult,
  ScorecardCriterionResult,
} from "./scorecard-result-zod";
import {
  scorecardLevelsByKey,
  scorecardNormalizedLevel,
} from "./scorecard-score";
import { tierFromSalesScore, type RankingTier } from "./team-ranking";

/**
 * Ce que la fiche RDV affiche d'une scorecard, préparé hors de React.
 *
 * Rien n'est recalculé ici. Les scores affichés sont ceux que le produit a
 * calculés le jour de l'analyse et enregistrés dans la ligne : rejouer les
 * niveaux dans la grille d'aujourd'hui montrerait au commercial un total que
 * personne n'a jamais obtenu, et qui ne serait pas celui de son classement. La
 * grille n'est relue que pour retrouver les intitulés, c'est-à-dire pour
 * traduire « B3 » en une phrase lisible.
 *
 * Conséquence assumée : une grille retirée du produit fait disparaître le
 * détail par critère, jamais la note. Le commercial garde son score, ses blocs
 * et ses points perdus ; il perd la liste des intitulés, faute d'un endroit
 * d'où les lire.
 */

export type ScorecardCriterionView = {
  readonly key: string;
  /** Intitulé lu dans la grille. */
  readonly label: string;
  /** Le niveau qui a compté dans le score, pas celui qu'on préférerait. */
  readonly level: number;
  readonly evidence: readonly string[];
};

export type ScorecardBlockView = {
  readonly key: string;
  readonly name: string;
  readonly score: number;
  readonly max: number;
  /** Part du maximum du bloc, en pourcentage entier, pour la jauge. */
  readonly percent: number;
  /** Vide quand la grille employée n'existe plus dans le produit. */
  readonly criteria: readonly ScorecardCriterionView[];
};

export type ScorecardPointLostView = {
  readonly key: string;
  /** Intitulé du critère, ou sa clé quand la grille ne la porte plus. */
  readonly label: string;
  readonly evidence: string;
  readonly whatToSayInstead: string;
};

export type ScorecardResultView = {
  readonly gridName: string;
  readonly overallScore: number;
  /** Palier atteint par le score, celui-là même que tout le produit affiche. */
  readonly tier: RankingTier | null;
  readonly blocks: readonly ScorecardBlockView[];
  readonly pointsLost: readonly ScorecardPointLostView[];
  readonly goldenQuestion: string;
  readonly challenge: string;
  readonly summary: string;
};

/** La clé telle qu'on la compare partout : sans espaces et en majuscules. */
function cleComparable(key: string): string {
  return key.trim().toUpperCase();
}

/**
 * Les intitulés de la grille, rangés par clé de critère.
 *
 * Une grille absente rend une table vide plutôt qu'une erreur : les clés
 * s'afficheront telles quelles, ce qui reste lisible.
 */
function libellesParCle(grid: ScorecardGrid | null): Map<string, string> {
  const parCle = new Map<string, string>();
  if (!grid) return parCle;
  for (const criterion of scorecardCriteria(grid)) {
    parCle.set(cleComparable(criterion.key), criterion.label);
  }
  return parCle;
}

/**
 * Les preuves rangées par clé, celles du niveau qui a compté.
 *
 * Le niveau retenu vient de `scorecardLevelsByKey`, qui tranche les doublons
 * vers le bas ; recopier cette règle ici la ferait vivre à deux endroits, et
 * elle finirait par dériver. On lui demande donc le niveau, et on ne garde que
 * les preuves d'une entrée qui l'atteint : un critère noté 1 puis 3 par un
 * modèle indécis compte pour 1 dans le score, et la fiche montre la citation du
 * 1. Montrer celle du 3 sous un niveau de 1 laisserait le commercial arbitrer
 * entre une note et une preuve qui ne parlent pas du même rendez-vous.
 */
function preuvesParCle(
  criteria: readonly ScorecardCriterionResult[],
  niveaux: ReadonlyMap<string, number>,
): Map<string, readonly string[]> {
  const parCle = new Map<string, readonly string[]>();
  for (const entry of criteria) {
    const cle = cleComparable(entry.key);
    if (!cle || parCle.has(cle)) continue;
    if (scorecardNormalizedLevel(entry.level) !== niveaux.get(cle)) continue;
    parCle.set(cle, entry.evidence);
  }
  return parCle;
}

/**
 * Part d'un score dans son maximum, en pourcentage entier.
 *
 * Un maximum nul ne vient d'aucune grille valide, dont les poids sont des
 * entiers strictement positifs, ni d'aucune ligne relue, dont le schéma exige
 * au moins 1. Il vient d'un objet construit à la main, et la division rendrait
 * alors une jauge large de l'infini plutôt qu'un écran vide.
 */
function partDuMaximum(score: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((score / max) * 100);
}

/**
 * Les critères d'un bloc, dans l'ordre de la grille et non dans celui du modèle.
 *
 * L'ordre du modèle n'en est pas un : il change d'un rendez-vous à l'autre, et
 * deux fiches lues à la suite ne se ressembleraient plus. Un critère que le
 * modèle a omis apparaît au niveau 0 sans preuve, exactement comme il a compté
 * dans le score. Un critère qu'il a rendu et que la grille ne porte pas
 * n'apparaît pas : il n'a rapporté aucun point, et l'afficher montrerait un
 * niveau dont rien dans le total ne vient.
 */
function detailDuBloc(
  grid: ScorecardGrid | null,
  blockKey: string,
  niveaux: ReadonlyMap<string, number>,
  preuves: ReadonlyMap<string, readonly string[]>,
): readonly ScorecardCriterionView[] {
  const bloc = grid?.blocks.find(
    (candidat) => cleComparable(candidat.key) === cleComparable(blockKey),
  );
  if (!bloc) return [];
  return bloc.criteria.map((criterion) => {
    const cle = cleComparable(criterion.key);
    return {
      key: criterion.key,
      label: criterion.label,
      level: niveaux.get(cle) ?? 0,
      evidence: preuves.get(cle) ?? [],
    };
  });
}

/** Tout ce que la fiche RDV a besoin de savoir d'une scorecard enregistrée. */
export function scorecardResultView(
  result: ScorecardAnalysisResult,
): ScorecardResultView {
  const grid = scorecardGridById(result.gridId);
  const niveaux = scorecardLevelsByKey(result.criteria);
  const preuves = preuvesParCle(result.criteria, niveaux);
  const libelles = libellesParCle(grid);

  return {
    gridName: result.gridName,
    overallScore: result.overallScore,
    tier: tierFromSalesScore(result.overallScore),
    blocks: result.blocks.map((block) => ({
      key: block.key,
      name: block.name,
      score: block.score,
      max: block.max,
      percent: partDuMaximum(block.score, block.max),
      criteria: detailDuBloc(grid, block.key, niveaux, preuves),
    })),
    pointsLost: result.pointsLost.map((point) => {
      const cle = cleComparable(point.key);
      return {
        key: cle,
        label: libelles.get(cle) ?? cle,
        evidence: point.evidence,
        whatToSayInstead: point.whatToSayInstead,
      };
    }),
    goldenQuestion: result.goldenQuestion,
    challenge: result.challenge,
    summary: result.summary,
  };
}

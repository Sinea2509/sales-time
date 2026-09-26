import {
  DEFAULT_SCORECARD_GRID,
  SCORECARD_LEVEL_MAX,
  scorecardGridById,
} from "./scorecard-grid";
import {
  scorecardResultSchema,
  type ScorecardAnalysisResult,
} from "./scorecard-result-zod";
import { scorecardLevelsByKey } from "./scorecard-score";

/**
 * Ce que plusieurs scorecards disent ensemble : le bloc de la grille qui
 * revient le plus souvent en retrait, le critère qui manque le plus souvent.
 *
 * La fiche d'un rendez-vous lit une scorecard ; les tableaux de bord en lisent
 * dix ou cent, et la question change : non plus « qu'a-t-il manqué ici » mais
 * « qu'est-ce qui manque tout le temps ». Ce module répond à la seconde, à
 * partir des lignes déjà enregistrées, sans rappeler le modèle.
 *
 * Les blocs se moyennent en pourcentage de leur poids et non en points : un
 * bloc à 12 points et un bloc à 32 se comparent alors sur la même échelle,
 * et « 46 % en moyenne » se lit sans connaître la grille.
 */

export type ScorecardBlockAverage = {
  key: string;
  name: string;
  /** Moyenne du bloc sur les scorecards lues, en pourcentage de son poids. */
  avgPercent: number;
  /** Scorecards qui portaient ce bloc. */
  meetings: number;
};

export type ScorecardCriterionShare = {
  key: string;
  label: string;
  blockKey: string;
  /** Niveau moyen, de 0 à 4. */
  avgLevel: number;
  /** Part des scorecards où le critère est à 0 ou 1 : le manque net. */
  lowSharePct: number;
  meetings: number;
};

/** Un bloc sous ce pourcentage de son poids compte comme « en retrait ». */
export const BLOCK_LOW_PCT = 60;

/** Niveau au-dessous duquel un critère compte comme manquant. */
const CRITERION_LOW_LEVEL = 1;

export function parseScorecards(
  results: readonly unknown[],
): ScorecardAnalysisResult[] {
  const out: ScorecardAnalysisResult[] = [];
  for (const raw of results) {
    const parsed = scorecardResultSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/** Le pourcentage d'un bloc sur une scorecard, ou `null` si elle ne le porte pas. */
export function blockPercent(
  result: ScorecardAnalysisResult,
  blockKey: string,
): number | null {
  const block = result.blocks.find((b) => b.key === blockKey);
  if (!block || block.max <= 0) return null;
  return Math.round((100 * block.score) / block.max);
}

/**
 * Les blocs moyens, du plus en retrait au plus solide.
 *
 * Les blocs se reconnaissent à leur clé : deux scorecards produites sur deux
 * versions d'une même grille additionnent leurs blocs « C » sans se soucier
 * du nom, qui est celui de la première rencontrée.
 */
export function scorecardBlockAverages(
  results: readonly ScorecardAnalysisResult[],
): ScorecardBlockAverage[] {
  const acc = new Map<
    string,
    { name: string; sum: number; meetings: number }
  >();
  for (const result of results) {
    for (const block of result.blocks) {
      if (block.max <= 0) continue;
      const pct = (100 * block.score) / block.max;
      const cur = acc.get(block.key) ?? {
        name: block.name,
        sum: 0,
        meetings: 0,
      };
      cur.sum += pct;
      cur.meetings += 1;
      acc.set(block.key, cur);
    }
  }
  return [...acc.entries()]
    .map(([key, v]) => ({
      key,
      name: v.name,
      avgPercent: Math.round(v.sum / v.meetings),
      meetings: v.meetings,
    }))
    .sort((a, b) => a.avgPercent - b.avgPercent || a.key.localeCompare(b.key));
}

/**
 * Les critères moyens, du plus manquant au mieux couvert.
 *
 * Les libellés viennent de la grille enregistrée avec chaque scorecard, pour
 * qu'une analyse vieille de six mois garde le nom du critère qu'elle notait.
 */
export function scorecardCriterionShares(
  results: readonly ScorecardAnalysisResult[],
): ScorecardCriterionShare[] {
  const acc = new Map<
    string,
    {
      label: string;
      blockKey: string;
      sum: number;
      low: number;
      meetings: number;
    }
  >();
  for (const result of results) {
    const grid = scorecardGridById(result.gridId) ?? DEFAULT_SCORECARD_GRID;
    const levels = scorecardLevelsByKey(result.criteria);
    for (const block of grid.blocks) {
      for (const criterion of block.criteria) {
        const key = criterion.key.toUpperCase();
        const level = levels.get(key) ?? 0;
        const cur = acc.get(key) ?? {
          label: criterion.label,
          blockKey: block.key,
          sum: 0,
          low: 0,
          meetings: 0,
        };
        cur.sum += level;
        if (level <= CRITERION_LOW_LEVEL) cur.low += 1;
        cur.meetings += 1;
        acc.set(key, cur);
      }
    }
  }
  return [...acc.entries()]
    .map(([key, v]) => ({
      key,
      label: v.label,
      blockKey: v.blockKey,
      avgLevel: Math.round((10 * v.sum) / v.meetings) / 10,
      lowSharePct: Math.round((100 * v.low) / v.meetings),
      meetings: v.meetings,
    }))
    .sort(
      (a, b) =>
        a.avgLevel - b.avgLevel ||
        b.lowSharePct - a.lowSharePct ||
        a.key.localeCompare(b.key),
    );
}

export type SellerMonthlyAxis = {
  key: string;
  name: string;
  avgPercent: number;
  /** Rendez-vous où ce bloc est sous le seuil `BLOCK_LOW_PCT`. */
  lowMeetings: number;
  meetings: number;
  /** Le rendez-vous où ce bloc est le plus bas : l'exemple concret à ouvrir. */
  exampleMeetingId: string | null;
};

/**
 * L'axe d'amélioration du mois d'un commercial : le bloc le plus en retrait
 * sur ses scorecards, et dans combien de rendez-vous il a manqué.
 */
export function sellerMonthlyAxis(
  rows: readonly { meetingId: string; result: unknown }[],
): SellerMonthlyAxis | null {
  const parsed = rows.flatMap((row) => {
    const p = scorecardResultSchema.safeParse(row.result);
    return p.success ? [{ meetingId: row.meetingId, result: p.data }] : [];
  });
  if (parsed.length === 0) return null;

  const averages = scorecardBlockAverages(parsed.map((p) => p.result));
  const weakest = averages[0];
  if (!weakest) return null;

  let lowMeetings = 0;
  let example: { meetingId: string; pct: number } | null = null;
  for (const { meetingId, result } of parsed) {
    const pct = blockPercent(result, weakest.key);
    if (pct == null) continue;
    if (pct < BLOCK_LOW_PCT) lowMeetings += 1;
    if (example == null || pct < example.pct) example = { meetingId, pct };
  }

  return {
    key: weakest.key,
    name: weakest.name,
    avgPercent: weakest.avgPercent,
    lowMeetings,
    meetings: weakest.meetings,
    exampleMeetingId: example?.meetingId ?? null,
  };
}

/** Le niveau maximal, exposé pour que les vues écrivent « sur 4 » depuis la même source. */
export const CRITERION_LEVEL_MAX = SCORECARD_LEVEL_MAX;

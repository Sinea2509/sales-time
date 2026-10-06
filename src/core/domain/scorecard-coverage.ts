import {
  SCORECARD_LEVEL_MAX,
  scorecardCriteria,
  type ScorecardGrid,
} from "./scorecard-grid";
import type {
  ScorecardCriterionResult,
  ScorecardExplored,
  ScorecardGeneratedResult,
  ScorecardLeveledResult,
  ScorecardObtained,
  ScorecardProof,
} from "./scorecard-result-zod";
import { evidenceWords, isExcerptInSource } from "./transcript-evidence";

/**
 * Le niveau d'un critère, déduit du relevé par une table fixe.
 *
 * |               | non abordé | abordé | creusé |
 * |---------------|-----------:|-------:|-------:|
 * | rien obtenu   |          0 |      1 |      2 |
 * | partiel       |          1 |      2 |      3 |
 * | exploitable   |          2 |      3 |      4 |
 *
 * Deux constats simples, chacun sur trois crans, remplacent un niveau de 0 à
 * 4 choisi au jugé : c'est ce qui rend la note stable et explicable. Elle
 * répond aussi à la revue du 5 octobre, où un critère valait 0 ou 4 sans rien
 * entre les deux : un sujet seulement abordé rapporte déjà des points, et un
 * commercial qui a creusé sans obtenir de réponse n'est pas noté comme celui
 * qui n'a rien demandé.
 */
const LEVEL_TABLE: Record<
  ScorecardObtained,
  Record<ScorecardExplored, number>
> = {
  rien: { non: 0, aborde: 1, creuse: 2 },
  partiel: { non: 1, aborde: 2, creuse: 3 },
  exploitable: { non: 2, aborde: 3, creuse: 4 },
};

export function scorecardLevelFromCoverage(
  explored: ScorecardExplored,
  obtained: ScorecardObtained,
): number {
  return LEVEL_TABLE[obtained][explored];
}

/** Ce que veut dire chaque cran, pour l'écran et pour la consigne. */
export const SCORECARD_EXPLORED_LABEL: Record<ScorecardExplored, string> = {
  non: "sujet non abordé par le commercial",
  aborde: "sujet abordé sans relance",
  creuse: "sujet creusé avec relance",
};

export const SCORECARD_OBTAINED_LABEL: Record<ScorecardObtained, string> = {
  rien: "rien d'utile obtenu",
  partiel: "information partielle",
  exploitable: "information exploitable",
};

/** Ce que le transcript a dit, entier et, quand il le permet, par côté. */
export type ScorecardEvidenceSources = {
  all: string;
  /** `null` quand le transcript ne distingue pas ses intervenants. */
  seller: string | null;
  prospect: string | null;
};

/** Un critère dont le produit fixe le niveau lui-même, à partir d'une mesure. */
export type ScorecardMeasuredCriterion = {
  level: number;
  learned: string;
  missing: string;
};

const LOWER_OBTAINED: Record<ScorecardObtained, ScorecardObtained> = {
  exploitable: "partiel",
  partiel: "rien",
  rien: "rien",
};

/**
 * Garde les citations retrouvées, et rend chacune à la personne qui l'a dite.
 *
 * Une citation attribuée au prospect et retrouvée seulement dans les paroles
 * du commercial change de côté au lieu de disparaître : c'est le cas exact du
 * levier SONCAS appuyé sur une phrase de Cédric dans la revue du 5 octobre.
 */
function checkedProofs(
  proofs: readonly ScorecardProof[],
  words: { all: string[]; seller: string[] | null; prospect: string[] | null },
): ScorecardProof[] {
  const kept: ScorecardProof[] = [];
  for (const proof of proofs) {
    if (kept.some((k) => k.quote.trim() === proof.quote.trim())) continue;
    if (!isExcerptInSource(proof.quote, words.all)) continue;
    if (words.seller && words.prospect) {
      const own = proof.who === "commercial" ? words.seller : words.prospect;
      const other = proof.who === "commercial" ? words.prospect : words.seller;
      if (
        !isExcerptInSource(proof.quote, own) &&
        isExcerptInSource(proof.quote, other)
      ) {
        kept.push({
          ...proof,
          who: proof.who === "commercial" ? "prospect" : "commercial",
        });
        continue;
      }
    }
    kept.push(proof);
  }
  return kept;
}

/**
 * Le relevé du modèle, vérifié et changé en niveaux.
 *
 * Les règles, dans l'ordre :
 * 1. une citation introuvable dans le transcript est retirée ; une citation
 *    retrouvée chez l'autre personne change de côté ;
 * 2. quand le transcript distingue ses intervenants, une information
 *    « obtenue » sans aucune parole du prospect retrouvée baisse d'un cran,
 *    et un sujet « creusé » sans aucune parole du commercial retrouvée
 *    devient « abordé » ;
 * 3. le niveau se lit dans la table ;
 * 4. un critère sans aucune citation ne dépasse pas le niveau 1 ;
 * 5. un critère mesuré par le produit (l'écoute) prend le niveau de la mesure.
 *
 * Seules les clés de la grille sont gardées, une fois chacune.
 */
export function levelScorecardObservations(
  generated: ScorecardGeneratedResult,
  grid: ScorecardGrid,
  sources: ScorecardEvidenceSources,
  measured: Readonly<Record<string, ScorecardMeasuredCriterion>> = {},
): ScorecardLeveledResult {
  const words = {
    all: evidenceWords(sources.all),
    seller: sources.seller != null ? evidenceWords(sources.seller) : null,
    prospect: sources.prospect != null ? evidenceWords(sources.prospect) : null,
  };
  const sidesKnown = words.seller != null && words.prospect != null;
  const known = new Map(
    scorecardCriteria(grid).map((c) => [c.key.toUpperCase(), c]),
  );
  const seen = new Set<string>();
  const criteria: ScorecardCriterionResult[] = [];

  for (const observation of generated.criteria) {
    const key = observation.key.trim().toUpperCase();
    const criterion = known.get(key);
    if (!criterion || seen.has(key)) continue;
    seen.add(key);

    const proofs = checkedProofs(observation.evidence, words);
    let explored = observation.explored;
    let obtained = observation.obtained;
    if (sidesKnown) {
      if (obtained !== "rien" && !proofs.some((p) => p.who === "prospect")) {
        obtained = LOWER_OBTAINED[obtained];
      }
      if (
        explored === "creuse" &&
        !proofs.some((p) => p.who === "commercial")
      ) {
        explored = "aborde";
      }
    }
    const fromTable = scorecardLevelFromCoverage(explored, obtained);
    const unproven = proofs.length === 0 && fromTable > 1;
    const level = unproven ? 1 : fromTable;

    const measure = criterion.measuredByProduct ? measured[key] : undefined;
    if (measure) {
      criteria.push({
        key: criterion.key,
        level: Math.max(0, Math.min(SCORECARD_LEVEL_MAX, measure.level)),
        evidence: [],
        learned: measure.learned,
        missing: measure.missing,
      });
      continue;
    }
    criteria.push({
      key: criterion.key,
      level,
      evidence: proofs.map((p) => p.quote),
      explored,
      obtained,
      learned: observation.learned.trim(),
      missing: observation.missing.trim(),
      ...(unproven ? { unproven: true } : {}),
    });
  }

  /* Un critère mesuré que le modèle aurait omis reçoit quand même sa mesure. */
  for (const [key, measure] of Object.entries(measured)) {
    const criterion = known.get(key.toUpperCase());
    if (!criterion || seen.has(criterion.key)) continue;
    criteria.push({
      key: criterion.key,
      level: measure.level,
      evidence: [],
      learned: measure.learned,
      missing: measure.missing,
    });
  }

  const levelOf = new Map(criteria.map((c) => [c.key, c.level]));
  const pointsLost = generated.pointsLost
    .map((p) => ({ ...p, key: p.key.trim().toUpperCase() }))
    .filter(
      (p) =>
        known.has(p.key) && (levelOf.get(p.key) ?? 0) < SCORECARD_LEVEL_MAX,
    )
    .sort((a, b) => (levelOf.get(a.key) ?? 0) - (levelOf.get(b.key) ?? 0));

  return {
    criteria,
    pointsLost,
    summary: generated.summary,
  };
}

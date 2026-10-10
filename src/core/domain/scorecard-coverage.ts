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
import {
  evidenceWords,
  hasFigure,
  isExcerptInSource,
} from "./transcript-evidence";

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
  /** Le transcript et les notes du commercial, ensemble. */
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

/** Une citation retrouvée, et où : dans les paroles de quelqu'un, ou ailleurs. */
type CheckedProof = ScorecardProof & {
  /**
   * Vrai quand la citation est dans les paroles de la personne à qui elle est
   * rendue. Faux quand elle n'est que dans les notes du commercial, ou dans un
   * transcript qui ne distingue pas ses intervenants et où l'on ne peut rien
   * dire de plus.
   */
  inSpeech: boolean;
};

/** La clé d'une citation, pour reconnaître la même sous deux ponctuations. */
function quoteKey(quote: string): string {
  return evidenceWords(quote).join(" ");
}

/**
 * Garde les citations retrouvées, et rend chacune à la personne qui l'a dite.
 *
 * Une citation attribuée au prospect et retrouvée seulement dans les paroles
 * du commercial change de côté au lieu de disparaître : c'est le cas exact du
 * levier SONCAS appuyé sur une phrase de Cédric dans la revue du 5 octobre.
 *
 * Une citation qui n'est dans les paroles de personne, mais dans les notes
 * du commercial, est gardée sans valoir une parole : les notes sont écrites
 * par le commercial, elles ne prouvent pas ce que le prospect a dit.
 *
 * Une citation déjà employée par un critère précédent est retirée : la même
 * phrase ne prouve pas deux thèmes.
 */
function checkedProofs(
  proofs: readonly ScorecardProof[],
  words: { all: string[]; seller: string[] | null; prospect: string[] | null },
  usedQuotes: Set<string>,
): CheckedProof[] {
  const kept: CheckedProof[] = [];
  for (const proof of proofs) {
    const key = quoteKey(proof.quote);
    if (!key || usedQuotes.has(key)) continue;
    if (kept.some((k) => quoteKey(k.quote) === key)) continue;
    if (!isExcerptInSource(proof.quote, words.all)) continue;
    if (words.seller && words.prospect) {
      const own = proof.who === "commercial" ? words.seller : words.prospect;
      const other = proof.who === "commercial" ? words.prospect : words.seller;
      if (isExcerptInSource(proof.quote, own)) {
        kept.push({ ...proof, inSpeech: true });
      } else if (isExcerptInSource(proof.quote, other)) {
        kept.push({
          ...proof,
          who: proof.who === "commercial" ? "prospect" : "commercial",
          inSpeech: true,
        });
      } else {
        kept.push({ ...proof, inSpeech: false });
      }
    } else {
      kept.push({ ...proof, inSpeech: true });
    }
    usedQuotes.add(key);
  }
  return kept;
}

const MONTHS_AND_DAYS =
  "janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche";
/**
 * Une échéance dite avec des mots : « d'ici la fin de la semaine », « l'année
 * prochaine », « à la rentrée ». Pas « en fin de compte » ni « l'année » seule.
 */
const TIME_WORDS =
  "la semaine prochaine|le mois prochain|l['’]année prochaine|l['’]an prochain|la semaine dernière|le mois dernier|l['’]année dernière|l['’]an dernier|cette semaine|ce mois-ci|cette année|ce trimestre|d['’]ici|avant la fin|fin de (?:la )?(?:semaine|mois|année|annee|trimestre)|à la rentrée|a la rentree|demain|la semaine du|le mois de";

/**
 * Vrai quand une citation du prospect donne quelque chose de précis : un
 * nombre, une date, une échéance, ou un nom propre (une personne, une
 * société, une ville), repéré à sa majuscule après un mot en minuscules,
 * au milieu d'une phrase.
 */
export function isConcrete(quote: string): boolean {
  if (hasFigure(quote)) return true;
  // Les lettres accentuées ne sont pas des « \b » : la frontière se pose à la main.
  const timeWords = new RegExp(
    `(?<![\\p{L}])(${MONTHS_AND_DAYS}|${TIME_WORDS})(?![\\p{L}])`,
    "iu",
  );
  if (timeWords.test(quote)) return true;
  return /\p{Ll}\s+\p{Lu}[\p{Ll}]{2,}/u.test(quote);
}

/** Un plafond posé par une mesure du produit, avec sa raison. */
export type ScorecardCap = { max: number; reason: string };

/**
 * Le relevé du modèle, vérifié et changé en niveaux.
 *
 * Les règles, dans l'ordre :
 * 1. une citation introuvable dans le transcript est retirée ; une citation
 *    retrouvée chez l'autre personne change de côté ; une citation déjà
 *    employée par un critère précédent est retirée ;
 * 2. quand le transcript distingue ses intervenants, les deux constats ne
 *    peuvent que baisser au vu des citations : un sujet « creusé » sans
 *    relance prouvée (la question du commercial et la réponse du prospect,
 *    ou deux paroles du commercial) devient « abordé » ; une information
 *    « obtenue » sans parole du prospect retrouvée baisse d'un cran ; une
 *    information « exploitable » dont aucune parole du prospect ne donne
 *    rien de précis devient « partielle ». Une citation tirée des notes ne
 *    compte pas comme une parole ;
 * 3. le niveau se lit dans la table ;
 * 4. un critère sans aucune citation ne dépasse pas le niveau 1 ;
 * 5. un critère qui exige un chiffre n'atteint pas 4 sans nombre dit par le
 *    prospect ; un plafond mesuré par le produit s'applique ensuite ;
 * 6. un critère que le produit sait non observable sort du calcul ; le
 *    modèle ne décide pas de cela ;
 * 7. un critère mesuré par le produit (l'écoute, les questions) prend le
 *    niveau de la mesure.
 *
 * Seules les clés de la grille sont gardées, une fois chacune.
 */
export function levelScorecardObservations(
  generated: ScorecardGeneratedResult,
  grid: ScorecardGrid,
  sources: ScorecardEvidenceSources,
  measured: Readonly<Record<string, ScorecardMeasuredCriterion>> = {},
  caps: Readonly<Record<string, ScorecardCap>> = {},
  /** Les critères que le produit sait non observables dans ce transcript. */
  unobservableKeys: ReadonlySet<string> = new Set(),
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
  const usedQuotes = new Set<string>();
  const criteria: ScorecardCriterionResult[] = [];

  for (const observation of generated.criteria) {
    const key = observation.key.trim().toUpperCase();
    const criterion = known.get(key);
    if (!criterion || seen.has(key)) continue;
    seen.add(key);

    const proofs = checkedProofs(observation.evidence, words, usedQuotes);
    const spoken = proofs.filter((p) => p.inSpeech);
    let explored = observation.explored;
    let obtained = observation.obtained;
    if (sidesKnown) {
      const sellerProofs = spoken.filter((p) => p.who === "commercial");
      const prospectProofs = spoken.filter((p) => p.who === "prospect");
      /*
        Ce que le commercial a fait du thème se lit dans les citations, pas
        dans l'humeur du modèle, et ne peut qu'en baisser : un thème n'est
        creusé que si la relance se voit, sa question et la réponse du
        prospect, ou deux de ses paroles sur le thème. Deux modèles qui
        citent les mêmes passages reçoivent le même niveau (revue du
        6 octobre 2026 : 75 avec GPT-4o, 54 avec Claude Sonnet), et aucun
        ne fait monter un relevé qu'il a lui-même écrit plus bas.
      */
      const relaunchShown =
        (sellerProofs.length > 0 && prospectProofs.length > 0) ||
        sellerProofs.length >= 2;
      if (explored === "creuse" && !relaunchShown) explored = "aborde";
      /*
        Une information est exploitable quand les mots du prospect donnent
        quelque chose de précis : un nombre, une date ou une échéance, un nom.
        Sans parole du prospect retrouvée, elle baisse d'un cran.
      */
      if (prospectProofs.length === 0) {
        if (obtained !== "rien") obtained = LOWER_OBTAINED[obtained];
      } else if (
        obtained === "exploitable" &&
        !prospectProofs.some((p) => isConcrete(p.quote))
      ) {
        obtained = "partiel";
      }
    }
    const fromTable = scorecardLevelFromCoverage(explored, obtained);
    const unproven = proofs.length === 0 && fromTable > 1;
    let level = unproven ? 1 : fromTable;
    let capped: string | undefined;
    let missing = observation.missing.trim();

    /*
      Un chiffre exigé : sans chiffre dit par le prospect (ses citations
      retrouvées dans ses paroles, avec le nombre exact), le niveau 4 n'est
      pas atteint.
    */
    if (
      criterion.requiresFigure &&
      level === SCORECARD_LEVEL_MAX &&
      !spoken.some((p) => p.who === "prospect" && hasFigure(p.quote))
    ) {
      level = SCORECARD_LEVEL_MAX - 1;
      capped = "aucun chiffre dit par le prospect";
    }
    /* Un plafond mesuré par le produit (argumentaire en début de rendez-vous). */
    const cap = caps[key];
    if (cap && level > cap.max) {
      level = cap.max;
      capped = cap.reason;
    }
    if (capped && !missing) missing = capped;

    /*
      Un moment que le transcript ne montre pas (l'ouverture, quand
      l'enregistrement a commencé après) sort du calcul au lieu de coûter des
      points. C'est le produit qui le constate, jamais le modèle : lui laisser
      ce choix, c'était lui laisser retirer quatre points de pénalité.
    */
    if (criterion.canBeUnobservable && unobservableKeys.has(key)) {
      criteria.push({
        key: criterion.key,
        level: 0,
        evidence: [],
        learned: observation.learned.trim(),
        missing: "",
        unobservable: true,
      });
      continue;
    }

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
      missing,
      ...(unproven ? { unproven: true } : {}),
      ...(capped ? { capped } : {}),
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
  const outOfScore = new Set(
    criteria.filter((c) => c.unobservable).map((c) => c.key),
  );
  const pointsLost = generated.pointsLost
    .map((p) => ({ ...p, key: p.key.trim().toUpperCase() }))
    .filter(
      (p) =>
        known.has(p.key) &&
        !outOfScore.has(p.key) &&
        (levelOf.get(p.key) ?? 0) < SCORECARD_LEVEL_MAX,
    )
    .sort((a, b) => (levelOf.get(a.key) ?? 0) - (levelOf.get(b.key) ?? 0));

  return {
    criteria,
    pointsLost,
    summary: generated.summary,
  };
}

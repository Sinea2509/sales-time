import { z } from "zod";
import {
  profileActionableAdviceSchema,
  type DiscAnalysisResult,
  type SoncasAnalysisResult,
} from "./analysis-result-zod";
import { evidenceWords, isExcerptInSource } from "./transcript-evidence";
import {
  DISC_STYLES,
  discMomentSchema,
  MOMENT_STRENGTHS,
  SONCAS_LEVERS,
  soncasMomentSchema,
  type DiscMoment,
  type DiscStyle,
  type SoncasLever,
  type SoncasMoment,
} from "./profile-moments-zod";

export {
  DISC_STYLES,
  SONCAS_LEVERS,
  type DiscMoment,
  type DiscStyle,
  type SoncasLever,
  type SoncasMoment,
};

/**
 * SONCAS et DISC lus sur des passages choisis, et non sur des mots pris
 * partout.
 *
 * Revue du 5 octobre 2026 (Thomas) : « il faut cibler les trois ou quatre
 * questions, et au vu des réponses récupérer le SONCAS ; sinon il pioche des
 * verbatim partout, et sur une heure de rendez-vous il prend n'importe quoi ».
 *
 * Le modèle relève donc d'abord les passages-clés : les réponses du prospect
 * qui révèlent ce qui le fait choisir (SONCAS), ou sa façon de réagir
 * (DISC). Pour chacun, il dit quels leviers ou quels styles le passage
 * montre, et avec quelle netteté. Le produit vérifie chaque passage dans les
 * paroles du prospect, puis calcule lui-même les notes, toujours de la même
 * façon : un levier vaut ce que valent les passages qui le montrent.
 */

/** Ce que le modèle rend pour SONCAS : des passages, pas de notes. */
export const soncasMomentsOutputSchema = z.object({
  moments: z.array(soncasMomentSchema).max(10),
  summary: z.string().min(1).max(1500),
  actionableAdvice: profileActionableAdviceSchema,
});

/** Ce que le modèle rend pour DISC : des passages, pas de notes. */
export const discMomentsOutputSchema = z.object({
  moments: z.array(discMomentSchema).max(10),
  summary: z.string().min(1).max(1500),
  actionableAdvice: profileActionableAdviceSchema,
});

export type SoncasMomentsOutput = z.infer<typeof soncasMomentsOutputSchema>;
export type DiscMomentsOutput = z.infer<typeof discMomentsOutputSchema>;

/**
 * La note d'un levier ou d'un style, d'après ses passages : un passage net
 * compte deux, un passage faible un.
 *
 * | points | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9 et plus |
 * |--------|----|----|----|----|----|----|----|----|----|-----------|
 * | note   | 10 | 25 | 45 | 52 | 62 | 70 | 78 | 85 | 90 | 95        |
 *
 * Un seul passage net place le levier dans la tranche « net » (40 à 59),
 * deux dans « marqué » (60 à 79), quatre dans « traverse le rendez-vous ».
 */
export const PROFILE_SCORE_BY_POINTS = [
  10, 25, 45, 52, 62, 70, 78, 85, 90, 95,
] as const;

export function profileScoreFromPoints(points: number): number {
  const index = Math.max(
    0,
    Math.min(PROFILE_SCORE_BY_POINTS.length - 1, Math.round(points)),
  );
  return PROFILE_SCORE_BY_POINTS[index];
}

function strengthPoints(strength: (typeof MOMENT_STRENGTHS)[number]): number {
  return strength === "nette" ? 2 : 1;
}

/** Garde les passages retrouvés mot pour mot dans les paroles du prospect. */
function keepFound<
  T extends { prospectWords: string; moment: string; sellerQuestion?: string },
>(moments: readonly T[], prospectText: string, sellerText: string | null): T[] {
  const words = evidenceWords(prospectText);
  const sellerWords = sellerText != null ? evidenceWords(sellerText) : null;
  const seen = new Set<string>();
  return moments
    .filter((m) => {
      const key = m.prospectWords.trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return isExcerptInSource(key, words);
    })
    .map((m) => ({
      ...m,
      // Un repère qui n'est pas un horodatage du transcript ne s'affiche pas.
      moment: TIMESTAMP.test(m.moment.trim()) ? m.moment.trim() : "",
      // La question n'est gardée que si c'est bien une question du commercial.
      ...(m.sellerQuestion !== undefined
        ? {
            sellerQuestion:
              m.sellerQuestion.trim().endsWith("?") &&
              (sellerWords == null ||
                isExcerptInSource(m.sellerQuestion.trim(), sellerWords))
                ? m.sellerQuestion.trim()
                : "",
          }
        : {}),
    }));
}

/** « 12:05 », « 1:02:30 », « 12'30 » : un horodatage recopié du transcript. */
const TIMESTAMP = /^\d{1,2}[:'’]\d{2}(?:[:'’]\d{2})?$/;

/** Le résultat SONCAS enregistré, avec ses passages. */
export type SoncasFromMoments = SoncasAnalysisResult & {
  moments: SoncasMoment[];
};

/**
 * Les notes SONCAS calculées sur les passages retrouvés. Un passage que les
 * paroles du prospect ne contiennent pas est écarté avant tout calcul.
 */
export function soncasFromMoments(
  output: SoncasMomentsOutput,
  prospectText: string,
  sellerText: string | null = null,
): SoncasFromMoments {
  const moments = keepFound(output.moments ?? [], prospectText, sellerText);
  const points = new Map<SoncasLever, number>();
  const nettes = new Map<SoncasLever, number>();
  const evidence = new Map<SoncasLever, string[]>();
  for (const m of moments) {
    const seenInMoment = new Set<SoncasLever>();
    for (const { lever, strength } of m.levers) {
      if (seenInMoment.has(lever)) continue;
      seenInMoment.add(lever);
      points.set(lever, (points.get(lever) ?? 0) + strengthPoints(strength));
      if (strength === "nette") nettes.set(lever, (nettes.get(lever) ?? 0) + 1);
      const list = evidence.get(lever) ?? [];
      if (list.length < 4) list.push(m.prospectWords.trim());
      evidence.set(lever, list);
    }
  }
  const drivers = Object.fromEntries(
    SONCAS_LEVERS.map((lever) => [
      lever,
      {
        score: profileScoreFromPoints(points.get(lever) ?? 0),
        evidence: evidence.get(lever) ?? [],
      },
    ]),
  ) as SoncasAnalysisResult["drivers"];
  const dominant = [...SONCAS_LEVERS].sort(
    (a, b) =>
      drivers[b].score - drivers[a].score ||
      (nettes.get(b) ?? 0) - (nettes.get(a) ?? 0) ||
      SONCAS_LEVERS.indexOf(a) - SONCAS_LEVERS.indexOf(b),
  )[0];
  return {
    drivers,
    dominant,
    summary: output.summary,
    actionableAdvice: output.actionableAdvice,
    moments,
  };
}

const DISC_NAMES: Record<DiscStyle, string> = {
  D: "Dominance",
  I: "Influence",
  S: "Stabilité",
  C: "Conformité",
};

/** L'ordre de départage des styles à égalité, celui de la consigne DISC. */
const DISC_TIE_ORDER: readonly DiscStyle[] = ["D", "I", "C", "S"];

/** Le résultat DISC enregistré, avec ses passages. */
export type DiscFromMoments = DiscAnalysisResult & { moments: DiscMoment[] };

/** Les notes DISC calculées sur les passages retrouvés. */
export function discFromMoments(
  output: DiscMomentsOutput,
  prospectText: string,
): DiscFromMoments {
  const moments = keepFound(output.moments ?? [], prospectText, null);
  const points = new Map<DiscStyle, number>();
  const nettes = new Map<DiscStyle, number>();
  const evidence: string[] = [];
  for (const m of moments) {
    const seenInMoment = new Set<DiscStyle>();
    for (const { style, strength } of m.styles) {
      if (seenInMoment.has(style)) continue;
      seenInMoment.add(style);
      points.set(style, (points.get(style) ?? 0) + strengthPoints(strength));
      if (strength === "nette") nettes.set(style, (nettes.get(style) ?? 0) + 1);
    }
    const main = m.styles[0];
    if (main && evidence.length < 6) {
      evidence.push(
        `${DISC_NAMES[main.style]} : « ${m.prospectWords.trim()} » ${m.behaviour.trim()}`,
      );
    }
  }
  const scores = Object.fromEntries(
    DISC_STYLES.map((s) => [s, profileScoreFromPoints(points.get(s) ?? 0)]),
  ) as DiscAnalysisResult["scores"];
  const dominant = [...DISC_TIE_ORDER].sort(
    (a, b) =>
      scores[b] - scores[a] ||
      (nettes.get(b) ?? 0) - (nettes.get(a) ?? 0) ||
      DISC_TIE_ORDER.indexOf(a) - DISC_TIE_ORDER.indexOf(b),
  )[0];
  return {
    scores,
    dominant,
    evidence,
    summary: output.summary,
    actionableAdvice: output.actionableAdvice,
    moments,
  };
}

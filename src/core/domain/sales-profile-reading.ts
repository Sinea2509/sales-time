import {
  salesProfileEvolution,
  type SalesProfileDimensionEvolution,
} from "./sales-profile-evolution";
import type {
  SalesProfileDimensionKey,
  SalesProfileScores,
} from "./sales-profile-from-meetings";
import { SELLER_SKILL_LABEL_FR } from "./seller-skill-signature";

export type SalesProfileReadingItem = {
  key: SalesProfileDimensionKey;
  label: string;
  value: number;
};

export type SalesProfileReadingMove = {
  key: SalesProfileDimensionKey;
  label: string;
  /** Variation relative, arrondie au dixième, en pourcentage. */
  deltaPct: number;
};

export type SalesProfileReading = {
  strongest: SalesProfileReadingItem;
  weakest: SalesProfileReadingItem;
  bestProgress: SalesProfileReadingMove | null;
  worstRegression: SalesProfileReadingMove | null;
  /** Les compétences, de la plus forte progression au plus net recul. */
  evolution: SalesProfileDimensionEvolution[];
  /** « Ce que cela traduit », en une à trois phrases. */
  text: string;
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const fr = (n: number) => String(round1(Math.abs(n))).replace(".", ",");

/**
 * Ce que le radar traduit, écrit comme la maquette du 11 septembre l'écrit :
 * le point d'appui, la marge la plus nette, la plus forte progression de la
 * période et, s'il y en a un, le recul où il faut regarder.
 *
 * `perspective` choisit la voix : « votre point d'appui » quand le commercial
 * se lit, « son point d'appui » quand son manager le lit. Aucun nombre n'en
 * dépend. À valeur égale, l'ordre des six compétences tranche, pour que deux
 * affichages de la même période nomment la même compétence.
 */
export function salesProfileReading(
  current: SalesProfileScores,
  previous: SalesProfileScores | null,
  perspective: "commercial" | "manager" = "commercial",
): SalesProfileReading {
  const evolution = [...salesProfileEvolution(current, previous)].sort(
    (a, b) => (b.deltaPct ?? -Infinity) - (a.deltaPct ?? -Infinity),
  );
  const byValue = [...salesProfileEvolution(current, previous)].sort(
    (a, b) => b.current - a.current,
  );
  const item = (
    e: SalesProfileDimensionEvolution,
  ): SalesProfileReadingItem => ({
    key: e.key,
    label: SELLER_SKILL_LABEL_FR[e.key],
    value: Math.round(e.current),
  });
  const move = (
    e: SalesProfileDimensionEvolution,
  ): SalesProfileReadingMove => ({
    key: e.key,
    label: SELLER_SKILL_LABEL_FR[e.key],
    deltaPct: round1(e.deltaPct ?? 0),
  });

  const strongest = item(byValue[0]!);
  const weakest = item(byValue[byValue.length - 1]!);
  const first = evolution[0];
  const last = evolution[evolution.length - 1];
  const bestProgress =
    first && first.deltaPct != null && first.deltaPct > 0 ? move(first) : null;
  const worstRegression =
    last && last.deltaPct != null && last.deltaPct < 0 ? move(last) : null;

  const votre = perspective === "commercial" ? "votre" : "son";
  const votreF = perspective === "commercial" ? "votre" : "sa";
  const sentences = [
    `Le critère ${strongest.label} est ${votre} point d'appui, à ${strongest.value} sur 100. Le critère ${weakest.label} est ${votreF} marge la plus nette, à ${weakest.value} sur 100.`,
  ];
  if (bestProgress) {
    sentences.push(
      `La plus forte progression de la période porte sur le critère ${bestProgress.label}, qui gagne ${fr(bestProgress.deltaPct)} %.`,
    );
  }
  if (worstRegression) {
    sentences.push(
      `Le critère ${worstRegression.label} recule de ${fr(worstRegression.deltaPct)} %, c'est là qu'il faut regarder.`,
    );
  }
  if (!previous) {
    sentences.push(
      "Première période mesurée : la progression se lira dès la prochaine.",
    );
  }

  return {
    strongest,
    weakest,
    bestProgress,
    worstRegression,
    evolution,
    text: sentences.join(" "),
  };
}

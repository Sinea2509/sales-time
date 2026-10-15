import type { ScorecardProof } from "./scorecard-result-zod";

/**
 * Ce qu'un critère exige du prospect pour atteindre le niveau 4.
 *
 * Revue du 15 octobre 2026 : sur le rendez-vous Noz, Claude Sonnet 5.5
 * donnait 4 à la prochaine étape sans date retenue, au périmètre sur « 43
 * heures » prises pour un effectif, au décideur sans savoir qui signe. Le
 * modèle n'avait pas tort sur le fond du relevé ; c'est la règle qui laissait
 * passer. Ces preuves se vérifient dans les citations retrouvées, toujours de
 * la même façon, quel que soit le modèle.
 */
export type ScorecardFullMarkProof =
  /** Un nombre, quel qu'il soit. */
  | "figure"
  /** Un nombre de personnes, de groupes, de sessions ou d'entités. */
  | "headcount"
  /** Une date ou un créneau, et l'accord du prospect. */
  | "acceptedDate"
  /** La personne ou la fonction qui décide, signe ou porte le budget. */
  | "namedDecider"
  /** Ce qui n'a pas marché, ou a déçu, dans ce qui a été essayé. */
  | "failureReason";

/** Les lettres accentuées ne sont pas des « \b » : les frontières se posent à la main. */
function words(alternatives: string): string {
  return `(?<![\\p{L}])(?:${alternatives})(?![\\p{L}])`;
}

const NUMBER = `\\d[\\d\\s.,]*|${[
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "quinze",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "cent",
  "cents",
  "mille",
  "milliers?",
  "dizaines?",
  "douzaines?",
  "vingtaines?",
  "trentaines?",
  "cinquantaines?",
  "centaines?",
].join("|")}`;

const COUNTED = [
  "personnes?",
  "gens",
  "collaborateurs?",
  "collaboratrices?",
  "salariés?",
  "employés?",
  "managers?",
  "manageurs?",
  "cadres?",
  "commerciaux",
  "vendeurs?",
  "participants?",
  "stagiaires?",
  "apprenants?",
  "formateurs?",
  "groupes?",
  "sessions?",
  "promos?",
  "promotions?",
  "équipes?",
  "sites?",
  "sociétés?",
  "entreprises?",
  "entités?",
  "filiales?",
  "magasins?",
  "agences?",
  "établissements?",
].join("|");

/** « 300 salariés », « une centaine de managers », « deux groupes de dix ». */
const HEADCOUNT = new RegExp(
  `(?<![\\p{L}\\d])(?:${NUMBER})(?:[\\s'’]+[\\p{L}-]+){0,2}?[\\s'’]+${words(COUNTED)}`,
  "iu",
);
/** « on est 300 », « nous sommes une cinquantaine ». */
const HEADCOUNT_VERB = new RegExp(
  `${words("on est|on sera|nous sommes|ils sont|elles sont|un effectif de|effectif d['’]environ")}\\s+(?:environ\\s+|à peu près\\s+|une?\\s+)?(?:${NUMBER})`,
  "iu",
);

const FIGURE = new RegExp(`(?<![\\p{L}])(?:${NUMBER})`, "iu");

const DATE = new RegExp(
  `${words(
    "janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|semaine prochaine|mois prochain",
  )}|\\d{1,2}\\s*h(?:\\s*\\d{2})?\\b|\\d{1,2}[/.]\\d{1,2}`,
  "iu",
);

const ACCEPTANCE = new RegExp(
  words(
    "ça me va|ca me va|ça nous va|ca nous va|c['’]est noté|bien noté|je note|je bloque|on bloque|je le bloque|on dit|va pour|parfait|ok|okay|d['’]accord|entendu|c['’]est bon|ça marche|ca marche|validé|je valide|je confirme|c['’]est calé|on cale|on se cale|c['’]est parfait|top|je vous envoie l['’]invitation|retenu",
  ),
  "iu",
);

const DECISION = new RegExp(
  words(
    "décide|décident|décidera|décision|décideur|décideuse|signe|signera|signature|budget|budgets|enveloppe|financement|finance|paie|paye|bon de commande|dernier mot|tranche|tranchera|arbitre|arbitrage|feu vert",
  ),
  "iu",
);
const DECIDER_ROLE = new RegExp(
  words(
    "directeur|directrice|direction|drh|dg|pdg|daf|président|présidente|responsable|patron|patronne|comité|codir|comex|gérant|gérante|associés?|n\\+1|n\\+2",
  ),
  "iu",
);
/** Un nom propre au milieu d'une phrase, repéré à sa majuscule : la casse compte. */
const PROPER_NOUN = /[\p{Ll},]\s+\p{Lu}[\p{Ll}]{2,}/u;

const FAILURE = new RegExp(
  words(
    "déçu|déçus|déçue|déçues|décevant|décevante|déception|pas satisfait|pas satisfaits|insatisfait|insatisfaits|n['’]a pas marché|n['’]ont pas marché|a pas marché|ont pas marché|n['’]a pas fonctionné|pas fonctionné|pas adapté|pas adaptée|pas applicable|pas applicables|peuvent pas appliquer|trop cher|trop chère|trop théorique|trop général|trop générique|du bateau|qualité|limite|limites|problème|souci|parce que|manque|manquait|perd|perdu son sens|pas convaincu|pas convaincus|pas efficace|pas pertinent|pas concret|ne correspondait|ne répondait|pas à la hauteur|pas terrible",
  ),
  "iu",
);

function prospectQuotes(proofs: readonly ScorecardProof[]): string[] {
  return proofs.filter((p) => p.who === "prospect").map((p) => p.quote);
}

/** Vrai quand les citations retrouvées apportent la preuve qu'exige le critère. */
export function fullMarkProofMet(
  proof: ScorecardFullMarkProof,
  proofs: readonly ScorecardProof[],
): boolean {
  const prospect = prospectQuotes(proofs);
  switch (proof) {
    case "figure":
      return prospect.some((q) => FIGURE.test(q));
    case "headcount":
      return prospect.some((q) => HEADCOUNT.test(q) || HEADCOUNT_VERB.test(q));
    case "acceptedDate":
      /*
        La date peut venir du commercial (« mardi 4 à 10 h ? ») ; l'accord,
        lui, ne peut venir que du prospect.
      */
      return (
        prospect.some((q) => ACCEPTANCE.test(q)) &&
        proofs.some((p) => DATE.test(p.quote))
      );
    case "namedDecider":
      return prospect.some(
        (q) =>
          DECISION.test(q) && (DECIDER_ROLE.test(q) || PROPER_NOUN.test(q)),
      );
    case "failureReason":
      return prospect.some((q) => FAILURE.test(q));
  }
}

/** Ce qu'on dit au modèle, au lecteur de la grille et au commercial plafonné. */
export const FULL_MARK_PROOF_TEXT: Record<
  ScorecardFullMarkProof,
  { flag: string; instruction: string; capped: string }
> = {
  figure: {
    flag: "chiffre exigé pour 4",
    instruction:
      "Chiffre exigé : le niveau 4 demande un nombre dit par le prospect, cité dans `evidence`.",
    capped: "aucun chiffre dit par le prospect",
  },
  headcount: {
    flag: "effectif exigé pour 4",
    instruction:
      "Effectif exigé : le niveau 4 demande un nombre de personnes, de groupes, de sessions ou d'entités dit par le prospect (« une centaine de managers », « trois sites »), cité dans `evidence`. Une durée, un prix ou un pourcentage ne compte pas.",
    capped: "aucun effectif dit par le prospect",
  },
  acceptedDate: {
    flag: "date acceptée exigée pour 4",
    instruction:
      "Date acceptée exigée : le niveau 4 demande une date ou un créneau ET l'accord du prospect (« ça me va », « c'est noté »), tous deux cités dans `evidence`. Des créneaux proposés à confirmer restent une information partielle.",
    capped: "aucune date acceptée par le prospect",
  },
  namedDecider: {
    flag: "décideur nommé exigé pour 4",
    instruction:
      "Décideur nommé exigé : le niveau 4 demande que le prospect dise qui décide, signe ou porte le budget, avec un nom ou une fonction, cité dans `evidence`. Savoir qui « valide » ou à qui on « soumet » ne suffit pas.",
    capped: "on ne sait pas qui décide ou signe",
  },
  failureReason: {
    flag: "raison de l'échec exigée pour 4",
    instruction:
      "Raison de l'échec exigée : le niveau 4 demande que le prospect dise ce qui n'a pas marché ou l'a déçu dans ce qui a été essayé, cité dans `evidence`. Des noms de prestataires seuls ne suffisent pas.",
    capped: "le prospect n'a pas dit ce qui n'a pas marché",
  },
};

import type { ScorecardCap } from "./scorecard-coverage";
import type { SellerConversationMeasures } from "./talk-share-from-transcript";

/** Le critère de la grille qui juge les questions. */
export const QUESTIONING_CRITERION_KEY = "E2";
/** Le critère de la grille qui juge la personnalisation du discours. */
export const PERSONALIZATION_CRITERION_KEY = "E3";

/** Un passage du commercial plus long que ceci, en début de rendez-vous, est un argumentaire déroulé. */
export const EARLY_PITCH_WORDS = 250;

/**
 * Le niveau que les questions du commercial autorisent, de 0 à 4.
 *
 * Revue du 5 octobre 2026 : « qualité du questionnement » recevait une bonne
 * note alors que la moitié des questions étaient fermées ou de simple
 * vérification. Le produit les compte : 4 demande au moins 55 % de questions
 * ouvertes et au moins huit d'entre elles, 3 au moins 40 %, sinon 2.
 */
export function questioningCap(
  questions: SellerConversationMeasures["questions"],
): ScorecardCap {
  const total = questions.open + questions.closed + questions.tag;
  const reason = `${questions.open} questions ouvertes sur ${total} (${questions.closed} fermées, ${questions.tag} de simple vérification)`;
  if (total === 0) return { max: 1, reason: "aucune question du commercial" };
  const share = questions.open / total;
  if (share >= 0.55 && questions.open >= 8) return { max: 4, reason };
  if (share >= 0.4) return { max: 3, reason };
  return { max: 2, reason };
}

/**
 * Le relevé du questionnement, écrit par le produit lui-même.
 *
 * Depuis le 6 octobre 2026, le niveau de ce critère vient du seul compte des
 * questions. Le relevé « abordé, creusé, obtenu » ne lui convenait pas : un
 * modèle notait « sujet non abordé » un commercial qui avait posé 54
 * questions, et le critère tombait à 0.
 */
export function questioningMeasure(
  questions: SellerConversationMeasures["questions"],
): { level: number; learned: string; missing: string } {
  const total = questions.open + questions.closed + questions.tag;
  if (total === 0) {
    return {
      level: 0,
      learned: "Le commercial n'a posé aucune question.",
      missing: "Poser des questions ouvertes pour faire parler le prospect.",
    };
  }
  const { max } = questioningCap(questions);
  const pct = Math.round((100 * questions.open) / total);
  const learned = `Le commercial a posé ${total} questions : ${questions.open} ouvertes (${pct} %), ${questions.closed} fermées et ${questions.tag} de simple vérification.`;
  const missing =
    max >= 4
      ? ""
      : questions.open < 8 && pct >= 55
        ? "Poser au moins huit questions ouvertes sur le rendez-vous."
        : `Faire passer les questions ouvertes de ${pct} % à au moins ${max >= 3 ? 55 : 40} % : remplacer les questions fermées et les « vous voyez ? » par des « comment », « qu'est-ce qui », « par exemple ? ».`;
  return { level: max, learned, missing };
}

/** Les plafonds que les mesures de conduite posent sur la grille. */
export function conversationCaps(
  measures: SellerConversationMeasures | null,
): Record<string, ScorecardCap> {
  if (!measures) return {};
  const caps: Record<string, ScorecardCap> = {};
  if (measures.earlyLongestRunWords >= EARLY_PITCH_WORDS) {
    caps[PERSONALIZATION_CRITERION_KEY] = {
      max: 2,
      reason: `un argumentaire de ${measures.earlyLongestRunWords} mots d'affilée dans le premier tiers du rendez-vous, avant que le besoin soit exploré`,
    };
  }
  return caps;
}

/** Les mesures de conduite, écrites pour la consigne de la grille. */
export function conversationMeasuresInstruction(
  measures: SellerConversationMeasures | null,
): string | null {
  if (!measures) return null;
  const caps = conversationCaps(measures);
  const questioning = questioningMeasure(measures.questions);
  const lines = [
    "## Conduite mesurée par le produit",
    `- Questions du commercial : ${questioning.learned} Le critère ${QUESTIONING_CRITERION_KEY} est fixé par le produit au niveau ${questioning.level} sur ce compte.`,
  ];
  const pitch = caps[PERSONALIZATION_CRITERION_KEY];
  lines.push(
    pitch
      ? `- Début de rendez-vous : ${pitch.reason}. Le critère ${PERSONALIZATION_CRITERION_KEY} ne dépasse pas le niveau ${pitch.max}.`
      : `- Début de rendez-vous : aucun long argumentaire du commercial dans le premier tiers.`,
  );
  return lines.join("\n");
}

import type { LikelyObjection } from "./meeting-briefing-zod";

/**
 * Une preuve qui ne dit pas son nom : un crochet laissé à compléter, ou des
 * clients anonymes (« nos clients », « d'autres entreprises », « plusieurs
 * références »). « des clients » n'y entre qu'avec ce qui en fait une preuve
 * (« des clients qui ont… ») : la phrase peut parler de ceux du prospect.
 */
const UNNAMED_PROOF =
  /\[[^\]]*\]|\bnos\s+(?:[\p{L}-]+\s+)?(?:références|clients)(?![\p{L}])|(?:\bd['’]autres|\bplusieurs|\bde\s+nombreux|\bde\s+nombreuses)\s+(?:[\p{L}-]+\s+)?(?:références|clients|entreprises)(?![\p{L}])|\bdes\s+(?:[\p{L}-]+\s+)?(?:références|clients|entreprises)\s+(?:dans|comme|ont|qui|du|de)\b/iu;

/** Sous ce nombre de mots, une réponse amputée n'est plus qu'une politesse. */
const AMPUTATED_ANSWER_MIN_WORDS = 8;

/**
 * Les objections à anticiper, sans les preuves que personne ne peut montrer.
 *
 * Le commercial répète ces réponses à son prospect. Un petit modèle écrivait
 * « des entreprises comme [client] ont constaté un retour rapide » même quand
 * la consigne l'interdisait (essai du 30 octobre 2026). Comme pour les citations
 * de la grille, le produit vérifie au lieu de faire confiance : la phrase part,
 * le reste de la réponse demeure. Une réponse dont il ne reste rien d'utile
 * (« C'est tout à fait compréhensible. ») fait disparaître son objection : une
 * objection sans réponse à préparer n'aide personne.
 */
export function withProvableAnswers(
  objections: readonly LikelyObjection[],
): LikelyObjection[] {
  const kept: LikelyObjection[] = [];
  for (const item of objections) {
    const sentences = item.answer.trim().split(/(?<=[.!?…])\s+/u);
    const provable = sentences.filter((s) => !UNNAMED_PROOF.test(s));
    const answer = provable.join(" ").trim();
    if (!answer) continue;
    const amputated = provable.length < sentences.length;
    const words = answer.split(/\s+/u).length;
    if (amputated && words < AMPUTATED_ANSWER_MIN_WORDS) continue;
    kept.push({ ...item, answer });
  }
  return kept;
}

/**
 * Les réglages qui rendent une analyse reproductible.
 *
 * Sans eux, chaque appel tirait sa réponse au hasard avec la température par
 * défaut du modèle : le même transcript, posé deux fois, sortait 38 puis 22.
 * Une température nulle fait choisir au modèle, à chaque mot, le plus probable
 * ; la graine fixe ce qui reste de hasard chez les fournisseurs qui
 * l'acceptent. Le produit garde en plus le résultat d'un appel identique (voir
 * `reuse-analysis-output.ts`), seule garantie absolue.
 *
 * Les modèles « à raisonnement » d'OpenAI refusent qu'on règle leur
 * température : ils ne reçoivent que la graine.
 */
export const STABLE_SEED = 20260929;

const REFUSES_TEMPERATURE = /^openai\/(o\d|gpt-5)/i;

export function stableCallSettings(model: string): {
  temperature?: number;
  seed: number;
} {
  if (REFUSES_TEMPERATURE.test(model)) return { seed: STABLE_SEED };
  return { temperature: 0, seed: STABLE_SEED };
}

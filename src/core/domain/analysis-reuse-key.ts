/**
 * La clé qui dit qu'un appel d'analyse a déjà été fait à l'identique.
 *
 * Même transcript, mêmes notes, même consigne, même modèle : le produit rend
 * le résultat déjà obtenu au lieu de reposer la question. C'est la seule
 * garantie absolue qu'un transcript posé deux fois reçoive deux fois la même
 * note ; la température nulle rend les réponses très proches, elle ne les rend
 * pas identiques chez tous les fournisseurs.
 *
 * La clé change dès qu'un mot de la consigne change : une consigne améliorée
 * produit une nouvelle analyse, jamais l'ancienne ressortie.
 */

/** Préfixe des entrées de réutilisation dans le cache des synthèses IA. */
export const ANALYSIS_REUSE_SCOPE_PREFIX = "ANALYSE_RDV:";

/**
 * À changer quand la forme d'un résultat change : une réponse rangée sous
 * l'ancienne forme ne doit pas ressortir dans la nouvelle.
 */
export const ANALYSIS_REUSE_FORMAT = "2026-10-06.2";

export function analysisReuseScopeKey(kind: string): string {
  return `${ANALYSIS_REUSE_SCOPE_PREFIX}${kind}`;
}

/** Le texte exact dont l'empreinte fait la clé. */
export function analysisReuseMaterial(input: {
  kind: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): string {
  return JSON.stringify([
    ANALYSIS_REUSE_FORMAT,
    input.kind,
    input.model,
    input.systemPrompt,
    input.userPrompt,
  ]);
}

import { createHash } from "node:crypto";

/**
 * Empreinte de cache d'un texte de synthèse.
 *
 * `AiSummaryCache` est indexé sur le triplet organisation, portée, empreinte.
 * L'empreinte ne décrivait que les rendez-vous, alors que deux autres textes
 * décident du récit produit : les consignes KISS de la plateforme et le
 * playbook de l'organisation. Une organisation qui corrigeait son playbook
 * relisait donc l'ancienne synthèse jusqu'à son prochain rendez-vous, sans
 * qu'aucun écran ne le signale.
 *
 * Les blocs sont résumés par une empreinte courte plutôt que recopiés : la clé
 * porte un index unique, et un playbook entier y dépasserait la taille
 * d'entrée admise par l'index.
 *
 * Sans aucun bloc, l'empreinte des rendez-vous est rendue telle quelle. Les
 * lignes déjà en cache des organisations qui n'ont rien rempli restent donc
 * lisibles, au lieu d'être toutes recalculées pour un contexte vide.
 */
export function aiSummaryCacheFingerprint(input: {
  meetingsFingerprint: string;
  promptContext: (string | null | undefined)[];
}): string {
  /*
    Le filtre reprend celui de `composeAnalysisSystemMarkdown`. Un bloc vide ou
    fait d'espaces ne change pas le prompt, il ne doit donc pas changer
    l'empreinte. Deux contextes qui produisent le même prompt partagent ainsi la
    même ligne de cache, et deux prompts différents ne la partagent jamais.
  */
  const kept: string[] = [];
  for (const block of input.promptContext) {
    const trimmed = block?.trim();
    if (trimmed) kept.push(trimmed);
  }
  if (kept.length === 0) return input.meetingsFingerprint;

  /*
    Chaque bloc est précédé de sa longueur. Collés bout à bout sans cette
    annonce, deux blocs voisins auraient la même empreinte qu'un seul bloc
    portant leur concaténation. Aucun séparateur ne conviendrait ici : le
    playbook comme les consignes sont du markdown libre, où tout caractère
    choisi pourrait un jour apparaître.
  */
  const payload = kept.map((block) => `${block.length}:${block}`).join("");
  const digest = createHash("sha256").update(payload, "utf8").digest("hex");
  return `${input.meetingsFingerprint}|ctx:${digest.slice(0, 16)}`;
}

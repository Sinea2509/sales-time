/**
 * Assemblage du prompt système d'une analyse.
 *
 * Le prompt envoyé au modèle est fait d'un prompt de base, versionné et édité
 * par le super admin, auquel s'ajoutent des blocs de contexte : les consignes
 * KISS de la plateforme, le playbook de l'organisation. Ces blocs étaient
 * concaténés à la main, à deux endroits, avec deux séparateurs différents. Une
 * seule fonction les assemble désormais, pour que la forme du prompt reste la
 * même quel que soit le chemin qui le construit.
 *
 * Le module est volontairement sans dépendance : il ne sait ni lire une base,
 * ni appeler un modèle. Il colle des chaines, et c'est tout ce qu'il fait.
 */

/**
 * Le séparateur entre deux blocs.
 *
 * La règle horizontale markdown sépare visuellement les blocs pour un lecteur
 * humain qui relit un `AiRequestLog`, et signale au modèle un changement de
 * nature du texte.
 */
const BLOCK_SEPARATOR = "\n\n---\n\n";

/** Titre du bloc de consignes KISS définies au niveau de la plateforme. */
export const KISS_PLATFORM_BLOCK_HEADING = "## Consignes KISS (plateforme)";

/**
 * Construit un bloc titré, ou `null` si le corps est vide.
 *
 * Un titre seul serait pire que rien : le modèle lirait une section annoncée
 * puis vide, et pourrait inventer ce qui aurait dû s'y trouver.
 */
export function analysisSystemBlock(
  heading: string,
  body: string | null | undefined,
): string | null {
  const trimmed = body?.trim();
  if (!trimmed) return null;
  return `${heading}\n\n${trimmed}`;
}

/**
 * Assemble le prompt de base et ses blocs de contexte.
 *
 * Quand aucun bloc n'est retenu, la base est renvoyée telle quelle, sans même
 * être rognée. C'est délibéré : une organisation qui n'a rien rempli doit
 * recevoir exactement le prompt qu'elle recevait avant l'existence de cette
 * fonction, à l'octet près. Le rognage n'intervient que lorsqu'il y a
 * réellement quelque chose à coller, pour éviter qu'un saut de ligne en trop
 * dans la base ne fasse flotter le séparateur.
 */
export function composeAnalysisSystemMarkdown(
  baseMarkdown: string,
  blocks: (string | null | undefined)[],
): string {
  const kept: string[] = [];
  for (const block of blocks) {
    const trimmed = block?.trim();
    if (trimmed) kept.push(trimmed);
  }
  if (kept.length === 0) return baseMarkdown;
  return [baseMarkdown.trim(), ...kept].join(BLOCK_SEPARATOR);
}

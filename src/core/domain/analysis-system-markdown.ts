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
 * Titre du bloc de consignes propres à une organisation, dans les synthèses.
 *
 * Il se termine par un deux-points et n'est pas un titre markdown, à la
 * différence des autres. C'est la forme employée depuis l'origine sur ce
 * chemin, et la changer modifierait le prompt de toutes les organisations qui
 * ont rempli leurs consignes, sans rien améliorer pour elles.
 */
export const ORGANIZATION_APPENDIX_HEADING =
  "Consignes spécifiques fournies par l'organisation (à respecter si compatibles avec les données) :";

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

/**
 * Les blocs de contexte d'une synthèse, dans l'ordre où ils sont collés.
 *
 * Les synthèses d'équipe et le récit KISS de l'organisation lisaient jusqu'ici
 * les seules consignes de l'organisation, en ignorant son playbook : elles
 * parlaient de sa méthode de vente sans savoir laquelle elle avait décrite. La
 * liste est exportée séparément du rendu parce que l'empreinte de cache doit
 * porter sur les mêmes blocs, dans le même ordre, sans risquer de diverger.
 * Un appelant la passe donc deux fois : à `composeAnalysisSystemMarkdown` pour
 * écrire le prompt, et à l'empreinte sous laquelle le texte sera relu.
 *
 * L'ordre suit celui du chemin par rendez-vous, consignes puis playbook, pour
 * qu'un lecteur d'`AiRequestLog` retrouve la même structure quel que soit le
 * texte qu'il relit.
 */
export function synthesisContextBlocks(input: {
  organizationKissPromptAppendix?: string | null;
  organizationPlaybookMarkdown?: string | null;
}): (string | null)[] {
  const appendix = input.organizationKissPromptAppendix?.trim();
  return [
    appendix ? `${ORGANIZATION_APPENDIX_HEADING}\n${appendix}` : null,
    input.organizationPlaybookMarkdown ?? null,
  ];
}

import { TypeValidationError } from "ai";
import { repairOverlongFields } from "./repair-overlong-fields";

type Issue = {
  code?: string;
  path?: readonly PropertyKey[];
};

/**
 * Relit une rubrique rendue en texte, avec ce qu'elle a emporté. Le texte se
 * termine sur la rubrique, sur l'accolade de la réponse entière, ou sur un
 * crochet en trop : les trois formes relevées.
 */
function membersOf(key: string, text: string): Record<string, unknown> | null {
  const body = text.trim();
  if (!/^[{[]/.test(body)) return null;
  for (const candidate of [body, body.slice(0, -1)]) {
    try {
      return JSON.parse(`{${JSON.stringify(key)}:${candidate}}`);
    } catch {
      // La forme suivante.
    }
  }
  return null;
}

/**
 * Remet en place les rubriques qu'un modèle a rendues en texte.
 *
 * Claude Haiku 5.5 écrit parfois une rubrique imbriquée comme un texte qui
 * contient son JSON, et souvent tout ce qui la suit :
 * `"concurrence": "{\"texte\": …}, \"objections\": […]"`. Le format refusait
 * alors toute la réponse : trois sur onze sur un rendez-vous d'une heure,
 * chaque fois sur une autre rubrique (essai du 30 octobre 2026). Le contenu est
 * là, entier, et il suffit de le remettre à sa place.
 */
function restoreStringifiedFields(options: {
  text: string;
  error: unknown;
}): string | null {
  if (!TypeValidationError.isInstance(options.error)) return null;
  const issues = ((options.error.cause as { issues?: Issue[] } | undefined)
    ?.issues ?? []) as Issue[];
  let value: unknown;
  try {
    value = JSON.parse(options.text);
  } catch {
    return null;
  }
  let restored = false;
  for (const issue of issues) {
    if (issue.code !== "invalid_type" || !Array.isArray(issue.path)) continue;
    const path = issue.path;
    let parent: unknown = value;
    for (const key of path.slice(0, -1)) {
      parent = (parent as Record<PropertyKey, unknown>)?.[key];
    }
    const last = path[path.length - 1];
    const holder = parent as Record<PropertyKey, unknown> | undefined;
    const current = holder?.[last];
    if (typeof current !== "string") continue;
    const members = membersOf(String(last), current);
    if (!members) continue;
    Object.assign(holder!, members);
    restored = true;
  }
  return restored ? JSON.stringify(value) : null;
}

/** Ce que le produit sait réparer dans une réponse refusée par le format. */
export async function repairStructuredOutput(options: {
  text: string;
  error: unknown;
}): Promise<string | null> {
  return restoreStringifiedFields(options) ?? repairOverlongFields(options);
}

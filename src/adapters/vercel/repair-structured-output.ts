import { TypeValidationError } from "ai";
import type { z } from "zod";

type Issue = {
  code?: string;
  expected?: string;
  origin?: string;
  maximum?: number | bigint;
  path?: readonly PropertyKey[];
};

/**
 * Une rubrique remise en place peut révéler ce qu'elle cachait : un texte joint
 * trop long, un champ de trop dans ce qu'elle avait emporté.
 */
const MAX_REPAIR_PASSES = 3;

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
 * Répare un champ sur place, et dit si quelque chose a changé. Trois écarts
 * relevés avec les modèles d'Anthropic, qui ne respectent pas le format à la
 * lettre :
 *
 * - un texte ou une liste trop longs : un horodatage de 45 caractères pour 40,
 *   un constat de 510 pour 500 (essai Claude Sonnet 4.6 du 6 octobre 2026) ;
 * - une rubrique rendue en texte, souvent avec tout ce qui la suit :
 *   `"concurrence": "{\"texte\": …}, \"objections\": […]"`, trois réponses sur
 *   onze sur un rendez-vous d'une heure, chaque fois sur une autre rubrique
 *   (Claude Haiku 5.5, 30 octobre 2026) ;
 * - une liste à la place d'un texte : les compétences visées des blocs
 *   Pipedrive, six réponses sur six sur ce même rendez-vous.
 *
 * Le contenu est là, entier : refuser toute la réponse pour sa forme ferait
 * échouer l'analyse pour rien.
 */
function repairField(
  holder: Record<PropertyKey, unknown>,
  key: PropertyKey,
  issue: Issue,
): boolean {
  const current = holder[key];
  if (issue.code === "too_big" && issue.maximum != null) {
    const max = Number(issue.maximum);
    if (typeof current === "string") {
      holder[key] = current.slice(0, max).trimEnd();
      return true;
    }
    if (Array.isArray(current)) {
      holder[key] = current.slice(0, max);
      return true;
    }
    return false;
  }
  if (issue.code !== "invalid_type") return false;
  if (typeof current === "string") {
    const members = membersOf(String(key), current);
    if (!members) return false;
    Object.assign(holder, members);
    return true;
  }
  if (
    issue.expected === "string" &&
    Array.isArray(current) &&
    current.every((item) => typeof item === "string")
  ) {
    holder[key] = current.join(", ");
    return true;
  }
  return false;
}

function repairFields(value: unknown, issues: readonly Issue[]): boolean {
  let repaired = false;
  for (const issue of issues) {
    const path = issue.path;
    if (!path?.length) continue;
    let parent: unknown = value;
    for (const key of path.slice(0, -1)) {
      parent = (parent as Record<PropertyKey, unknown> | undefined)?.[key];
    }
    if (parent == null || typeof parent !== "object") continue;
    const holder = parent as Record<PropertyKey, unknown>;
    if (repairField(holder, path[path.length - 1], issue)) repaired = true;
  }
  return repaired;
}

/**
 * La réparation à donner à `generateObject` pour ce format : elle ne rend une
 * réponse que si le format l'accepte, et toute autre erreur reste une erreur.
 */
export function repairStructuredOutput(schema: z.ZodType) {
  return async (options: {
    text: string;
    error: unknown;
  }): Promise<string | null> => {
    if (!TypeValidationError.isInstance(options.error)) return null;
    let value: unknown;
    try {
      value = JSON.parse(options.text);
    } catch {
      return null;
    }
    let issues = ((options.error.cause as { issues?: Issue[] } | undefined)
      ?.issues ?? []) as readonly Issue[];
    for (let pass = 0; pass < MAX_REPAIR_PASSES; pass += 1) {
      if (!repairFields(value, issues)) return null;
      const checked = schema.safeParse(value);
      if (checked.success) return JSON.stringify(value);
      issues = checked.error.issues as readonly Issue[];
    }
    return null;
  };
}

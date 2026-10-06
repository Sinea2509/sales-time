import { TypeValidationError } from "ai";

type Issue = {
  code?: string;
  origin?: string;
  maximum?: number | bigint;
  path?: readonly PropertyKey[];
};

/**
 * Coupe un texte ou une liste trop longs au lieu de rejeter toute la réponse.
 *
 * Les modèles d'Anthropic ne respectent pas les longueurs maximales du
 * format : un horodatage de 45 caractères pour 40, un constat de 510 pour
 * 500. Le format refusait alors toute la réponse et l'analyse échouait
 * (essai Claude Sonnet 4.6 du 6 octobre 2026). Seuls les dépassements de
 * longueur sont réparés ; toute autre erreur reste une erreur.
 */
export async function repairOverlongFields(options: {
  text: string;
  error: unknown;
}): Promise<string | null> {
  if (!TypeValidationError.isInstance(options.error)) return null;
  const issues = ((options.error.cause as { issues?: Issue[] } | undefined)
    ?.issues ?? []) as Issue[];
  const fixable = issues.filter(
    (i) =>
      i.code === "too_big" &&
      (i.origin === "string" || i.origin === "array") &&
      i.maximum != null &&
      Array.isArray(i.path),
  );
  if (fixable.length === 0 || fixable.length !== issues.length) return null;
  let value: unknown;
  try {
    value = JSON.parse(options.text);
  } catch {
    return null;
  }
  for (const issue of fixable) {
    const path = issue.path!;
    let parent: unknown = value;
    for (const key of path.slice(0, -1)) {
      parent = (parent as Record<PropertyKey, unknown>)?.[key];
    }
    const last = path[path.length - 1];
    const holder = parent as Record<PropertyKey, unknown> | undefined;
    const current = holder?.[last];
    const max = Number(issue.maximum);
    if (typeof current === "string") {
      holder![last] = current.slice(0, max).trimEnd();
    } else if (Array.isArray(current)) {
      holder![last] = current.slice(0, max);
    }
  }
  return JSON.stringify(value);
}

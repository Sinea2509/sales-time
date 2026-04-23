/** Suggestions intégrées (hors base) — fusionnées avec les phrases partagées en base. */

export const DEFAULT_OBJECTION_PHRASES = [
  "C’est trop cher",
  "On a déjà un prestataire",
  "Ce n’est pas le bon moment",
  "Il faut que j’en parle à mon directeur",
  "On va réfléchir",
] as const;

export const DEFAULT_ARGUMENT_PHRASES = [
  "ROI démontré : nos clients réduisent leurs coûts de 30 % en moyenne",
  "Livraison : intervention sur site en moins de 48 h",
  "Garantie satisfait ou remboursé 30 jours",
  "Références clients du même secteur disponibles sur demande",
  "Accompagnement dédié dès la signature",
] as const;

export function normalizePhraseKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

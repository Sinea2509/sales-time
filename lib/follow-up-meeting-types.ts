/**
 * Les types de rendez-vous qu'on prépare pour un prospect déjà rencontré.
 *
 * La qualification et la découverte n'en font pas partie : elles ont déjà eu
 * lieu avec ce prospect, et un briefing « de découverte » sur quelqu'un
 * qu'on connaît repartirait de zéro. Si l'organisation n'a défini que ces
 * deux types, la liste entière est rendue plutôt qu'un sélecteur vide.
 */
const FIRST_MEETING_TYPES = ["qualification", "decouverte"];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function followUpMeetingTypes(options: readonly string[]): string[] {
  const kept = options.filter(
    (type) => !FIRST_MEETING_TYPES.includes(normalize(type)),
  );
  return kept.length > 0 ? kept : [...options];
}

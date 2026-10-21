/*
  Un nombre en tête de texte, à la française : « 62 % », « 1 240 € », « 3,4 ».
  Le reste du texte ne doit plus contenir de chiffre : « 2 h 15 » ne
  s'anime pas, « 0 h 15 » qui devient « 2 h 15 » ne voudrait rien dire.
*/
const LEADING_NUMBER =
  /^([^\d-]*)(-?\d{1,3}(?:[\s\u00a0\u202f]\d{3})+|-?\d+)(?:,(\d+))?(\D*)$/u;

export type LeadingNumber = {
  prefix: string;
  value: number;
  decimals: number;
  suffix: string;
};

/** Le nombre qui ouvre un texte, ou null s'il n'y en a pas un seul. */
export function parseLeadingNumber(text: string): LeadingNumber | null {
  const m = LEADING_NUMBER.exec(text);
  if (!m) return null;
  const [, prefix, whole, fraction, suffix] = m;
  const value = Number(
    `${whole.replace(/[\s\u00a0\u202f]/gu, "")}.${fraction ?? "0"}`,
  );
  if (!Number.isFinite(value)) return null;
  return { prefix, value, decimals: fraction?.length ?? 0, suffix };
}

/** Le même texte, avec une autre valeur à la place du nombre. */
export function formatLeadingNumber(n: LeadingNumber, value: number): string {
  return `${n.prefix}${value.toLocaleString("fr-FR", {
    minimumFractionDigits: n.decimals,
    maximumFractionDigits: n.decimals,
  })}${n.suffix}`;
}

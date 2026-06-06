/** Prénom + nom, ou repli sur l’e-mail si le profil n’est pas renseigné. */
export function formatUserDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const full = [input.firstName, input.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  if (full) return full;
  return input.email?.trim() ?? "—";
}

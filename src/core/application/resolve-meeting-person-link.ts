import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";

export type ResolvedMeetingPersonLink = {
  personId: string | null;
  prospectName: string;
};

/**
 * When no contact is selected, links the meeting to an existing contact whose
 * company name matches the typed prospect name (e.g. "Doha" → Margaux @ Doha).
 *
 * Avec `visibleTo`, le rapprochement ne se fait qu'avec les contacts de ce
 * commercial : sinon un nom d'entreprise tapé rattacherait le rendez-vous au
 * contact d'un collègue, et en afficherait le nom (voir `contactsVisibleTo`).
 */
export async function resolveMeetingPersonLink(
  contacts: ContactRepositoryPort,
  input: {
    organizationId: string;
    personId: string | null;
    prospectName: string;
    visibleTo?: string;
  },
): Promise<ResolvedMeetingPersonLink> {
  if (input.personId) {
    return {
      personId: input.personId,
      prospectName: input.prospectName.trim(),
    };
  }

  const trimmed = input.prospectName.trim();
  const byCompany = await contacts.findUniqueByCompanyName({
    organizationId: input.organizationId,
    companyName: trimmed,
    visibleTo: input.visibleTo,
  });
  if (byCompany) {
    return {
      personId: byCompany.id,
      prospectName: byCompany.displayName,
    };
  }

  return { personId: null, prospectName: trimmed };
}

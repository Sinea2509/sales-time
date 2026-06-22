import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";

export type ResolvedMeetingPersonLink = {
  personId: string | null;
  prospectName: string;
};

/**
 * When no contact is selected, links the meeting to an existing contact whose
 * company name matches the typed prospect name (e.g. "Doha" → Margaux @ Doha).
 */
export async function resolveMeetingPersonLink(
  contacts: ContactRepositoryPort,
  input: {
    organizationId: string;
    personId: string | null;
    prospectName: string;
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
  });
  if (byCompany) {
    return {
      personId: byCompany.id,
      prospectName: byCompany.displayName,
    };
  }

  return { personId: null, prospectName: trimmed };
}

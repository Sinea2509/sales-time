import { excludeProspectCompanyAliasContacts } from "@/src/core/domain/prospect-list-identity";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";

export async function listContactsForOrg(
  deps: { contacts: ContactRepositoryPort },
  input: {
    organizationId: string;
    search?: string;
    limit: number;
    offset: number;
    /** Restreint aux contacts de ce commercial (voir `contactsVisibleTo`). */
    visibleTo?: string;
  },
) {
  const [rows, companyAliases] = await Promise.all([
    deps.contacts.listForOrg(input),
    deps.contacts.findProspectCompanyAliasByPersonId({
      organizationId: input.organizationId,
      visibleTo: input.visibleTo,
    }),
  ]);
  return excludeProspectCompanyAliasContacts(rows, companyAliases);
}

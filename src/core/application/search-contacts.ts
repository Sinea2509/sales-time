import { excludeProspectCompanyAliasContacts } from "@/src/core/domain/prospect-list-identity";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";

export async function searchContactsByPrefix(
  deps: { contacts: ContactRepositoryPort },
  input: {
    organizationId: string;
    prefix: string;
    limit?: number;
    /** Restreint aux contacts de ce commercial (voir `contactsVisibleTo`). */
    visibleTo?: string;
  },
) {
  const [rows, companyAliases] = await Promise.all([
    deps.contacts.searchByPrefix({
      organizationId: input.organizationId,
      prefix: input.prefix,
      limit: input.limit ?? 10,
      visibleTo: input.visibleTo,
    }),
    deps.contacts.findProspectCompanyAliasByPersonId({
      organizationId: input.organizationId,
      visibleTo: input.visibleTo,
    }),
  ]);
  return excludeProspectCompanyAliasContacts(rows, companyAliases);
}

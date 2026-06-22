import { excludeProspectCompanyAliasContacts } from "@/src/core/domain/prospect-list-identity";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";

export async function searchContactsByPrefix(
  deps: { contacts: ContactRepositoryPort },
  input: {
    organizationId: string;
    prefix: string;
    limit?: number;
  },
) {
  const [rows, companyAliases] = await Promise.all([
    deps.contacts.searchByPrefix({
      organizationId: input.organizationId,
      prefix: input.prefix,
      limit: input.limit ?? 10,
    }),
    deps.contacts.findProspectCompanyAliasByPersonId({
      organizationId: input.organizationId,
    }),
  ]);
  return excludeProspectCompanyAliasContacts(rows, companyAliases);
}

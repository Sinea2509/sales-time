import { excludeProspectCompanyAliasContacts } from "@/src/core/domain/prospect-list-identity";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";

export async function listContactsForOrg(
  deps: { contacts: ContactRepositoryPort },
  input: {
    organizationId: string;
    search?: string;
    limit: number;
    offset: number;
  },
) {
  const [rows, companyAliases] = await Promise.all([
    deps.contacts.listForOrg(input),
    deps.contacts.findProspectCompanyAliasByPersonId({
      organizationId: input.organizationId,
    }),
  ]);
  return excludeProspectCompanyAliasContacts(rows, companyAliases);
}

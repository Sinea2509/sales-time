import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";

export async function searchContactsByPrefix(
  deps: { contacts: ContactRepositoryPort },
  input: {
    organizationId: string;
    prefix: string;
    limit?: number;
  },
) {
  return deps.contacts.searchByPrefix({
    organizationId: input.organizationId,
    prefix: input.prefix,
    limit: input.limit ?? 10,
  });
}

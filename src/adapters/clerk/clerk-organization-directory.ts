import { createClerkClient } from "@clerk/backend";
import { requireClerkKeys } from "@/lib/env";
import type { OrganizationDirectoryPort } from "@/src/core/ports/organization-directory-port";

export function makeClerkOrganizationDirectoryPort(): OrganizationDirectoryPort {
  return {
    async listOrganizations({ limit }) {
      const { secretKey } = requireClerkKeys();
      const clerk = createClerkClient({ secretKey });
      const { data } = await clerk.organizations.getOrganizationList({
        limit,
      });
      return data.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug ?? null,
      }));
    },
  };
}

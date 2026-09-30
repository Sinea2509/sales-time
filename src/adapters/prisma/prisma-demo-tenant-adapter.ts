import type { PrismaClient } from "@/lib/generated/prisma/client";
import {
  DEMO_ORG_SLUG,
  DEMO_PASSWORD_DEFAULT,
  ensureDemoTenant,
} from "@/prisma/seed-demo-data";
import type {
  DemoOrganizationPromptVersions,
  DemoOrganizationResult,
  DemoTenantPort,
} from "@/src/core/ports/demo-tenant-port";

export class PrismaDemoTenantAdapter implements DemoTenantPort {
  constructor(private readonly db: PrismaClient) {}

  async ensureDemoOrganization(input: {
    promptVersions: DemoOrganizationPromptVersions;
  }): Promise<DemoOrganizationResult> {
    /*
      Le remplissage ne rend rien : il écrit, puis on relit ce qui existe. La
      carte d'administration montre ainsi l'état réel de la démo, y compris
      quand elle était déjà là et que rien n'a bougé.
    */
    await ensureDemoTenant(this.db, input.promptVersions, {
      slug: DEMO_ORG_SLUG,
      password: DEMO_PASSWORD_DEFAULT,
    });

    const org = await this.db.organization.findUniqueOrThrow({
      where: { slug: DEMO_ORG_SLUG },
      select: {
        id: true,
        slug: true,
        name: true,
        _count: { select: { memberships: true, meetings: true } },
        memberships: {
          orderBy: { role: "asc" },
          select: { role: true, user: { select: { email: true } } },
        },
      },
    });

    const manager = org.memberships.find((m) => m.role === "ADMIN");
    return {
      organizationId: org.id,
      slug: org.slug,
      name: org.name,
      password: DEMO_PASSWORD_DEFAULT,
      managerEmail: manager?.user.email ?? "",
      salesEmails: org.memberships
        .filter((m) => m.role !== "ADMIN")
        .map((m) => m.user.email),
      memberCount: org._count.memberships,
      meetingCount: org._count.meetings,
    };
  }
}

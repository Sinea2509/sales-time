import type { PrismaClient } from "@/lib/generated/prisma/client";
import { hashToken } from "@/lib/auth/tokens";
import type {
  AcceptOrganizationInvitationResult,
  OrganizationInvitationPreview,
  OrganizationInvitationRepositoryPort,
} from "@/src/core/ports/organization-invitation-repository-port";

export class PrismaOrganizationInvitationRepository implements OrganizationInvitationRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async findPendingByTokenForPreview(
    tokenPlaintext: string,
  ): Promise<OrganizationInvitationPreview | null> {
    const th = hashToken(tokenPlaintext);
    const inv = await this.db.organizationInvitation.findFirst({
      where: {
        tokenHash: th,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: { organization: { select: { name: true } } },
    });
    if (!inv) return null;
    return {
      email: inv.email,
      role: inv.role === "ADMIN" ? "ADMIN" : "MEMBER",
      organizationName: inv.organization.name,
    };
  }

  async acceptPendingInvitation(input: {
    tokenPlaintext: string;
    userId: string;
    userEmail: string;
  }): Promise<AcceptOrganizationInvitationResult> {
    const th = hashToken(input.tokenPlaintext);
    const inv = await this.db.organizationInvitation.findFirst({
      where: {
        tokenHash: th,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
    if (!inv) {
      return { ok: false, error: "INVALID" };
    }
    if (input.userEmail.toLowerCase() !== inv.email.toLowerCase()) {
      return { ok: false, error: "EMAIL_MISMATCH" };
    }

    await this.db.$transaction([
      this.db.organizationMembership.upsert({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: inv.organizationId,
          },
        },
        create: {
          userId: input.userId,
          organizationId: inv.organizationId,
          role: inv.role,
        },
        update: { role: inv.role },
      }),
      this.db.organizationInvitation.update({
        where: { id: inv.id },
        data: {
          status: "ACCEPTED",
          acceptedByUserId: input.userId,
        },
      }),
    ]);

    return { ok: true, organizationId: inv.organizationId };
  }
}

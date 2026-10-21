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
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!inv) return null;
    const account = await this.db.user.findFirst({
      where: { email: { equals: inv.email, mode: "insensitive" } },
      select: { id: true },
    });
    const inviterName = [inv.invitedBy?.firstName, inv.invitedBy?.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ");
    return {
      email: inv.email,
      role: inv.role === "ADMIN" ? "ADMIN" : "MEMBER",
      organizationName: inv.organization.name,
      inviterName: inviterName || null,
      expiresAt: inv.expiresAt,
      accountExists: account != null,
    };
  }

  async findLatestPendingForEmail(email: string): Promise<{
    id: string;
    organizationName: string;
    inviterName: string | null;
    expiresAt: Date;
  } | null> {
    const inv = await this.db.organizationInvitation.findFirst({
      where: {
        email: { equals: email.trim(), mode: "insensitive" },
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!inv) return null;
    const inviterName = [inv.invitedBy?.firstName, inv.invitedBy?.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ");
    return {
      id: inv.id,
      organizationName: inv.organization.name,
      inviterName: inviterName || null,
      expiresAt: inv.expiresAt,
    };
  }

  async replaceTokenHash(input: {
    id: string;
    tokenHash: string;
  }): Promise<void> {
    await this.db.organizationInvitation.updateMany({
      where: { id: input.id, status: "PENDING" },
      data: { tokenHash: input.tokenHash },
    });
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

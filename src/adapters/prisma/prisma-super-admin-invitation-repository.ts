import type { PrismaClient } from "@/lib/generated/prisma/client";
import { hashToken } from "@/lib/auth/tokens";
import type {
  AcceptSuperAdminInvitationResult,
  SuperAdminInvitationPreview,
  SuperAdminInvitationRepositoryPort,
} from "@/src/core/ports/super-admin-invitation-repository-port";

export class PrismaSuperAdminInvitationRepository implements SuperAdminInvitationRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async findPendingByTokenForPreview(
    tokenPlaintext: string,
  ): Promise<SuperAdminInvitationPreview | null> {
    const th = hashToken(tokenPlaintext);
    const inv = await this.db.superAdminInvitation.findFirst({
      where: {
        tokenHash: th,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
    if (!inv) return null;
    return { email: inv.email };
  }

  async acceptPendingInvitation(input: {
    tokenPlaintext: string;
    userId: string;
    userEmail: string;
  }): Promise<AcceptSuperAdminInvitationResult> {
    const th = hashToken(input.tokenPlaintext);
    const inv = await this.db.superAdminInvitation.findFirst({
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
      this.db.systemRole.upsert({
        where: {
          userId_role: { userId: input.userId, role: "SUPER_ADMIN" },
        },
        create: { userId: input.userId, role: "SUPER_ADMIN" },
        update: {},
      }),
      this.db.superAdminInvitation.update({
        where: { id: inv.id },
        data: {
          status: "ACCEPTED",
          acceptedByUserId: input.userId,
        },
      }),
    ]);

    return { ok: true };
  }
}

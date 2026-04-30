import type { PrismaClient } from "@/lib/generated/prisma/client";
import { hashToken } from "@/lib/auth/tokens";
import type { PasswordResetRepositoryPort } from "@/src/core/ports/password-reset-repository-port";

export class PrismaPasswordResetRepository implements PasswordResetRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async findActiveUserByEmail(
    email: string,
  ): Promise<{ id: string; email: string } | null> {
    const user = await this.db.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });
    if (!user || user.status === "DISABLED") return null;
    return { id: user.id, email: user.email };
  }

  async createResetToken(input: {
    userId: string;
    rawToken: string;
    expiresAt: Date;
  }): Promise<void> {
    const tokenHash = hashToken(input.rawToken);
    await this.db.passwordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash,
        expiresAt: input.expiresAt,
      },
    });
  }

  async resetPasswordWithToken(input: {
    rawToken: string;
    passwordHash: string;
  }): Promise<{ ok: true } | { ok: false }> {
    const th = hashToken(input.rawToken);
    const row = await this.db.passwordResetToken.findFirst({
      where: {
        tokenHash: th,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!row) {
      return { ok: false };
    }

    await this.db.$transaction([
      this.db.user.update({
        where: { id: row.userId },
        data: { passwordHash: input.passwordHash },
      }),
      this.db.passwordResetToken.updateMany({
        where: { userId: row.userId },
        data: { consumedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }
}

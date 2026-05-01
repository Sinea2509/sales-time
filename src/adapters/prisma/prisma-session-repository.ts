import type { PrismaClient } from "@/lib/generated/prisma/client";
import { hashToken } from "@/lib/auth/tokens";
import { SESSION_MAX_AGE_SEC } from "@/lib/auth/constants";
import type { SessionPrincipal } from "@/src/core/domain/session-principal";
import type { SystemRoleType } from "@/src/core/domain/system-role-type";
import type { SessionRepositoryPort } from "@/src/core/ports/session-repository-port";

function mapSystemRoles(roles: { role: string }[]): SystemRoleType[] {
  const out: SystemRoleType[] = [];
  for (const r of roles) {
    if (r.role === "SUPER_ADMIN") out.push("SUPER_ADMIN");
  }
  return out;
}

export class PrismaSessionRepository implements SessionRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async createSessionRecord(input: {
    userId: string;
    rawToken: string;
    userAgent?: string | null;
  }): Promise<void> {
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);
    await this.db.session.create({
      data: {
        userId: input.userId,
        tokenHash: hashToken(input.rawToken),
        expiresAt,
        userAgent: input.userAgent?.slice(0, 512) ?? null,
      },
    });
  }

  async deleteSessionByRawToken(rawToken: string): Promise<void> {
    await this.db.session.deleteMany({
      where: { tokenHash: hashToken(rawToken) },
    });
  }

  async deleteAllSessionsForUser(userId: string): Promise<void> {
    await this.db.session.deleteMany({ where: { userId } });
  }

  async findSessionPrincipal(
    rawToken: string,
  ): Promise<SessionPrincipal | null> {
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const row = await this.db.session.findFirst({
      where: { tokenHash, expiresAt: { gt: now } },
      include: {
        user: {
          include: {
            systemRoles: true,
            organizationMemberships: {
              select: { organizationId: true, role: true },
            },
          },
        },
      },
    });
    if (!row) return null;
    try {
      await this.db.session.update({
        where: { id: row.id },
        data: { lastSeenAt: now },
      });
    } catch {
      // Best-effort: do not fail auth if lastSeen write fails (e.g. transient DB).
    }
    const u = row.user;
    return {
      sessionId: row.id,
      userId: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      registerProfileCompletedAt: u.registerProfileCompletedAt,
      systemRoles: mapSystemRoles(u.systemRoles),
      memberships: u.organizationMemberships.map((m) => ({
        organizationId: m.organizationId,
        role: m.role === "ADMIN" ? "ADMIN" : "MEMBER",
      })),
    };
  }
}
